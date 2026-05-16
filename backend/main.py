import csv
import io
import json
import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from config import MODELS, WORLDVIEWS
from llm_service import ask_slots
from models import (
    AskRequest,
    AskResponse,
    ModelInfo,
    ModelResponse,
    Question,
    QuestionCreate,
    QuestionUpdate,
    StoredResponse,
    Worldview,
)
import storage

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "questions.json")

app = FastAPI(title="Trolley Problem LLM Comparison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_questions: list[Question] = []


def _load_questions_from_file(path: str) -> list[Question]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [Question(**q) for q in data]


def _save_questions_to_file(path: str, questions: list[Question]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([q.model_dump() for q in questions], f, indent=2, ensure_ascii=False)


def _parse_questions_csv(content: str) -> list[Question]:
    reader = csv.DictReader(io.StringIO(content))
    questions = []
    for row in reader:
        options = [o.strip() for o in row["options"].split(";")]
        questions.append(
            Question(
                id=int(row["id"]),
                title=row["title"],
                prompt=row["prompt"],
                options=options,
            )
        )
    return questions


@app.on_event("startup")
def startup_event():
    global _questions
    _questions = _load_questions_from_file(QUESTIONS_FILE)


@app.get("/api/questions", response_model=list[Question])
def get_questions():
    return _questions


@app.post("/api/questions", response_model=Question, status_code=201)
def create_question(body: QuestionCreate):
    global _questions
    new_id = max((q.id for q in _questions), default=0) + 1
    question = Question(id=new_id, title=body.title, prompt=body.prompt, options=body.options)
    _questions.append(question)
    _save_questions_to_file(QUESTIONS_FILE, _questions)
    return question


@app.put("/api/questions/{question_id}", response_model=Question)
def update_question(question_id: int, body: QuestionUpdate):
    for i, q in enumerate(_questions):
        if q.id == question_id:
            updated = q.model_copy(update={k: v for k, v in body.model_dump().items() if v is not None})
            _questions[i] = updated
            _save_questions_to_file(QUESTIONS_FILE, _questions)
            return updated
    raise HTTPException(status_code=404, detail="Question not found")


@app.delete("/api/questions/{question_id}", status_code=204)
def delete_question(question_id: int):
    global _questions
    before = len(_questions)
    _questions = [q for q in _questions if q.id != question_id]
    if len(_questions) == before:
        raise HTTPException(status_code=404, detail="Question not found")
    _save_questions_to_file(QUESTIONS_FILE, _questions)


@app.get("/api/models", response_model=list[ModelInfo])
def get_models():
    return [ModelInfo(**m) for m in MODELS]


@app.get("/api/worldviews", response_model=list[Worldview])
def get_worldviews():
    return [Worldview(**w) for w in WORLDVIEWS]


@app.post("/api/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    question = next((q for q in _questions if q.id == request.question_id), None)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    responses: list[ModelResponse] = []
    slots_to_query = []

    for slot in request.slots:
        cached = None if request.force else storage.get_cached(question.id, slot.slot_id, slot.model_id, slot.worldview_id)
        if cached:
            responses.append(
                ModelResponse(
                    slot_id=cached.slot_id,
                    model_id=cached.model_id,
                    display_name=cached.display_name,
                    worldview_id=cached.worldview_id,
                    worldview_label=cached.worldview_label,
                    choice=cached.choice,
                    reasoning=cached.reasoning,
                    moral_framework=cached.moral_framework,
                    error=cached.error,
                    cached=True,
                )
            )
        else:
            slots_to_query.append(slot)

    if slots_to_query:
        fresh = await ask_slots(question, slots_to_query)
        for resp in fresh:
            storage.save_response(question.id, resp, question)
        responses.extend(fresh)

    slot_order = {s.slot_id: i for i, s in enumerate(request.slots)}
    responses.sort(key=lambda r: slot_order.get(r.slot_id, 999))

    return AskResponse(question_id=question.id, responses=responses)


@app.get("/api/responses", response_model=list[StoredResponse])
def get_responses():
    return storage.get_all_responses()


@app.get("/api/export")
def export(format: str = "json"):
    if format == "csv":
        content = storage.export_csv()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=responses.csv"},
        )
    content = storage.export_json()
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=responses.json"},
    )


@app.post("/api/questions/upload", response_model=list[Question])
async def upload_questions(file: UploadFile = File(...)):
    global _questions
    content = (await file.read()).decode("utf-8")
    filename = file.filename or ""
    try:
        if filename.endswith(".csv"):
            _questions = _parse_questions_csv(content)
        else:
            data = json.loads(content)
            _questions = [Question(**q) for q in data]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}")
    _save_questions_to_file(QUESTIONS_FILE, _questions)
    return _questions
