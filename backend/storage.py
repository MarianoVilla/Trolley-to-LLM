import csv
import hashlib
import io
import json
import os
from datetime import datetime, timezone
from models import ModelResponse, Question, StoredResponse

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RESPONSES_FILE = os.path.join(DATA_DIR, "responses.json")


def _load_all() -> list[dict]:
    if not os.path.exists(RESPONSES_FILE):
        return []
    with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _save_all(records: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def compute_question_hash(question: Question) -> str:
    payload = {
        "title": question.title.strip(),
        "prompt": question.prompt.strip(),
        "options": [o.strip() for o in question.options],
    }
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _is_duplicate(record: dict, question_hash: str, model_id: str, worldview_id: str) -> bool:
    return (
        record.get("question_hash") == question_hash
        and record.get("model_id") == model_id
        and record.get("worldview_id") == worldview_id
    )


def save_response(question: Question, response: ModelResponse) -> StoredResponse | None:
    question_hash = compute_question_hash(question)
    records = _load_all()

    if any(_is_duplicate(r, question_hash, response.model_id, response.worldview_id) for r in records):
        return None

    stored = StoredResponse(
        question_id=question.id,
        question_hash=question_hash,
        question_title=question.title,
        question_prompt=question.prompt,
        question_options=question.options,
        slot_id=response.slot_id,
        model_id=response.model_id,
        display_name=response.display_name,
        worldview_id=response.worldview_id,
        worldview_label=response.worldview_label,
        choice=response.choice,
        reasoning=response.reasoning,
        moral_framework=response.moral_framework,
        error=response.error,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    records.append(stored.model_dump())
    _save_all(records)
    return stored


def get_all_responses() -> list[StoredResponse]:
    return [StoredResponse(**r) for r in _load_all()]


def export_json() -> str:
    return json.dumps(
        [r.model_dump() for r in get_all_responses()], indent=2, ensure_ascii=False
    )


def export_csv() -> str:
    records = get_all_responses()
    output = io.StringIO()
    fieldnames = [
        "question_id",
        "question_hash",
        "question_title",
        "question_prompt",
        "question_options",
        "slot_id",
        "model_id",
        "display_name",
        "worldview_id",
        "worldview_label",
        "choice",
        "reasoning",
        "moral_framework",
        "error",
        "timestamp",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for r in records:
        row = r.model_dump()
        row["question_options"] = "; ".join(row["question_options"] or [])
        writer.writerow(row)
    return output.getvalue()
