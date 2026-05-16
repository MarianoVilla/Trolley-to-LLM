import asyncio
import json
import httpx
from models import Question, ModelResponse, Slot
import base64
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, IMAGE_MODEL, MODELS, WORLDVIEWS_BY_ID

PROMPT_TEMPLATE = """\
Responde el siguiente dilema moral al estilo del tranvía.

Elige una de las opciones disponibles y explica brevemente tu razonamiento.

Devuelve únicamente JSON, sin bloques de markdown ni texto adicional:

{{
  "choice": "...",
  "reasoning": "...",
  "moral_framework": "..."
}}

Pregunta:
{prompt}

Opciones disponibles:
{options}"""

MODELS_BY_ID: dict[str, dict] = {m["model_id"]: m for m in MODELS}


def _build_user_message(question: Question) -> str:
    options_text = "\n".join(f"- {opt}" for opt in question.options)
    return PROMPT_TEMPLATE.format(prompt=question.prompt, options=options_text)


async def _query_slot(
    client: httpx.AsyncClient,
    slot: Slot,
    user_message: str,
    system_prompt: str,
    display_name: str,
    worldview_label: str,
) -> ModelResponse:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_message})

    try:
        resp = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": slot.model_id,
                "messages": messages,
                "temperature": 0.7,
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"].strip()

        if raw_content.startswith("```"):
            lines = raw_content.splitlines()
            raw_content = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()

        parsed = json.loads(raw_content)
        return ModelResponse(
            slot_id=slot.slot_id,
            model_id=slot.model_id,
            display_name=display_name,
            worldview_id=slot.worldview_id,
            worldview_label=worldview_label,
            choice=parsed.get("choice"),
            reasoning=parsed.get("reasoning"),
            moral_framework=parsed.get("moral_framework"),
        )
    except json.JSONDecodeError as exc:
        return ModelResponse(
            slot_id=slot.slot_id,
            model_id=slot.model_id,
            display_name=display_name,
            worldview_id=slot.worldview_id,
            worldview_label=worldview_label,
            error=f"JSON parse error: {exc}",
        )
    except httpx.HTTPStatusError as exc:
        return ModelResponse(
            slot_id=slot.slot_id,
            model_id=slot.model_id,
            display_name=display_name,
            worldview_id=slot.worldview_id,
            worldview_label=worldview_label,
            error=f"HTTP {exc.response.status_code}: {exc.response.text[:300]}",
        )
    except Exception as exc:
        return ModelResponse(
            slot_id=slot.slot_id,
            model_id=slot.model_id,
            display_name=display_name,
            worldview_id=slot.worldview_id,
            worldview_label=worldview_label,
            error=str(exc),
        )


IMAGE_PROMPT_TEMPLATE = (
    "Generate a simple, dramatic illustration of the following moral dilemma. "
    "No text, no labels, no words anywhere in the image. Scene: {prompt}"
)


async def generate_question_image(question: Question) -> bytes:
    user_message = IMAGE_PROMPT_TEMPLATE.format(prompt=question.prompt)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": IMAGE_MODEL,
                "messages": [{"role": "user", "content": user_message}],
                "modalities": ["image"],
            },
            timeout=120.0,
        )
        resp.raise_for_status()
        data = resp.json()
        message = data["choices"][0]["message"]

        image_url: str | None = None

        if message.get("images"):
            image_url = message["images"][0]["image_url"]["url"]
        elif isinstance(message.get("content"), list):
            for part in message["content"]:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    image_url = part["image_url"]["url"]
                    break
        elif isinstance(message.get("content"), str):
            content = message["content"].strip()
            if content.startswith("data:"):
                image_url = content

        if image_url is None:
            raise ValueError(f"No image found in response. Message keys: {list(message.keys())}, content sample: {str(message.get('content', ''))[:200]}")

        if "," in image_url:
            image_url = image_url.split(",", 1)[1]
        return base64.b64decode(image_url)


async def ask_slots(question: Question, slots: list[Slot]) -> list[ModelResponse]:
    user_message = _build_user_message(question)
    async with httpx.AsyncClient() as client:
        tasks = []
        for slot in slots:
            model_info = MODELS_BY_ID.get(slot.model_id, {})
            display_name = model_info.get("display_name", slot.model_id)
            worldview = WORLDVIEWS_BY_ID.get(slot.worldview_id, {})
            system_prompt = worldview.get("system_prompt", "")
            worldview_label = worldview.get("label", slot.worldview_id)
            tasks.append(
                _query_slot(client, slot, user_message, system_prompt, display_name, worldview_label)
            )
        results = await asyncio.gather(*tasks)
    return list(results)
