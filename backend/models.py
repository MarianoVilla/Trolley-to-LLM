from pydantic import BaseModel
from typing import Optional


class Question(BaseModel):
    id: int
    title: str
    prompt: str
    options: list[str]


class QuestionCreate(BaseModel):
    title: str
    prompt: str
    options: list[str]


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    options: Optional[list[str]] = None


class ModelInfo(BaseModel):
    model_id: str
    display_name: str


class Worldview(BaseModel):
    id: str
    label: str
    system_prompt: str


class Slot(BaseModel):
    slot_id: str
    model_id: str
    worldview_id: str


class ModelResponse(BaseModel):
    slot_id: str
    model_id: str
    display_name: str
    worldview_id: str
    worldview_label: str
    choice: Optional[str] = None
    reasoning: Optional[str] = None
    moral_framework: Optional[str] = None
    error: Optional[str] = None
    cached: bool = False


class AskRequest(BaseModel):
    question_id: int
    slots: list[Slot]
    force: bool = False


class AskResponse(BaseModel):
    question_id: int
    responses: list[ModelResponse]


class StoredResponse(BaseModel):
    question_id: int
    question_title: Optional[str] = None
    question_prompt: Optional[str] = None
    question_options: Optional[list[str]] = None
    slot_id: str
    model_id: str
    display_name: str
    worldview_id: str
    worldview_label: str
    choice: Optional[str] = None
    reasoning: Optional[str] = None
    moral_framework: Optional[str] = None
    error: Optional[str] = None
    timestamp: str
