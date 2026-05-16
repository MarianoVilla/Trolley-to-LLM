import csv
import io
import json
import os
from datetime import datetime, timezone
from models import ModelResponse, StoredResponse

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


def _matches(record: dict, question_id: int, slot_id: str, model_id: str, worldview_id: str) -> bool:
    return (
        record["question_id"] == question_id
        and record.get("slot_id") == slot_id
        and record.get("model_id") == model_id
        and record.get("worldview_id") == worldview_id
    )


def get_cached(question_id: int, slot_id: str, model_id: str, worldview_id: str) -> StoredResponse | None:
    for record in _load_all():
        if _matches(record, question_id, slot_id, model_id, worldview_id):
            return StoredResponse(**record)
    return None


def save_response(question_id: int, response: ModelResponse) -> StoredResponse:
    records = _load_all()
    records = [
        r for r in records
        if not _matches(r, question_id, response.slot_id, response.model_id, response.worldview_id)
    ]
    stored = StoredResponse(
        question_id=question_id,
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
        writer.writerow(r.model_dump())
    return output.getvalue()
