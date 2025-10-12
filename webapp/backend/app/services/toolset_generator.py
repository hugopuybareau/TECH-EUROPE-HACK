import json
import uuid
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.models.template import TemplatePart


async def generate_resolved_steps(
    questionnaire_answers: Dict[str, Any],
    template_parts: List[TemplatePart]
) -> List[Dict[str, Any]]:
    """
    Build resolved steps via OpenAI; fall back to heuristic generator if the call fails.
    """
    serialized_parts = [_serialize_template_part(part) for part in template_parts]

    openai_steps = await _call_openai(questionnaire_answers, serialized_parts)
    if openai_steps is not None:
        return openai_steps

    print("[OpenAI] Falling back to heuristic resolved steps.")
    return _fallback_steps(questionnaire_answers, template_parts)


async def _call_openai(
    questionnaire_answers: Dict[str, Any],
    serialized_parts: List[Dict[str, Any]]
) -> Optional[List[Dict[str, Any]]]:
    if not settings.OPENAI_API_KEY:
        print("[OpenAI] API key not configured; skipping OpenAI call.")
        return None

    base_url = settings.OPENAI_BASE_URL.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    print(questionnaire_answers)
    print(serialized_parts)
    result = []
    for part in serialized_parts:
        for field in part.get("fields", []):
            fid = field.get("id")
            if fid in questionnaire_answers:
                item = {
                    "part_id": part.get("id"),
                    "part_title": part.get("title"),
                    **{k: v for k, v in field.items() if k != "options"},
                    "chosen_value": questionnaire_answers[fid],
                }
                result.append(item)
    print(result)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an onboarding assistant. Return JSON with resolved onboarding steps. "
                "The response must be a JSON object with a `resolved_steps` array. "
                "Each step must include: id (string UUID), title, instructions, commands (array of strings), "
                "validator (null), and context (null) summarizing relevant answers."
                "You are provided with template parts which are the basis for the steps."
                "Each template part needs to be specifically addressed to the user needs or answers he provided in the questionnaire."
                "You return a list of steps. Theses steps are composed of a title, the description or instruction and an eventual command to be executed by the user."
                "You can provide several substeps per template part if needed. Don't hesitate to break down into small steps, one command at a time for example."
                "You do not only have to use validators from the template parts, you can also create your own validators if needed AND if you think it makes sense. As well, you can also decide to not use a validator for a step if it doesn't make sense."
                "Please ensure that the response is valid JSON."
                "The steps you generate are about installing, onboarding, setting up, configuring, learning, using tools, software, platforms, environments, IDEs, plugins, extensions, etc, do not forget that."
                "The user is on MacOS. Always prefer to use homebrew to install software when possible. Oh and do not forget to add a step to verify brew is installed."
            ),
        },
        {
            "role": "user",
            "content": (
                f"{json.dumps(result, indent=2)}\n\n"
            ),
        },
    ]

    payload = {
        "model": settings.OPENAI_MODEL,
        "response_format": {"type": "json_object"},
        "messages": messages,
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            body = response.json()
            print(body)

            choices = body.get("choices") or []
            if not choices:
                print("[OpenAI] WARNING: No choices returned.")
                return None

            message = choices[0].get("message", {})
            content = message.get("content")
            if not content:
                print("[OpenAI] WARNING: Empty message content.")
                return None

            parsed = json.loads(content)
            steps = parsed.get("resolved_steps")
            if isinstance(steps, list):
                return steps

            print("[OpenAI] WARNING: Response missing `resolved_steps` array.")
    except httpx.HTTPStatusError as exc:
        print(f"[OpenAI] ERROR: {exc.response.status_code} - {exc.response.text[:300]}")
    except Exception as exc:  # noqa: BLE001
        print(f"[OpenAI] ERROR: Failed to call OpenAI: {type(exc).__name__}: {exc}")

    return None


def _serialize_template_part(part: TemplatePart) -> Dict[str, Any]:
    return {
        "id": str(part.id),
        "title": part.title,
        "description": part.description,
        "role_key": part.role_key,
        "tags": part.tags or [],
        "fields": part.fields or [],
        "validators": part.validators or [],
    }


def _fallback_steps(
    questionnaire_answers: Dict[str, Any],
    template_parts: List[TemplatePart],
) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []

    for part in template_parts:
        answer_summary = _build_answer_summary(part, questionnaire_answers)
        steps.append(
            {
                "id": str(uuid.uuid4()),
                "title": part.title,
                "instructions": part.description or f"Complete the {part.title} task.",
                "commands": [],
                "validator": (part.validators[0] if part.validators else None),
                "context": answer_summary or None,
            }
        )

    if steps:
        return steps

    # Default fallback when no template parts exist.
    return [
        {
            "id": str(uuid.uuid4()),
            "title": "Review questionnaire answers",
            "instructions": "No template parts configured; review responses and craft onboarding plan manually.",
            "commands": [],
            "validator": None,
            "context": questionnaire_answers,
        }
    ]


def _build_answer_summary(
    part: TemplatePart,
    questionnaire_answers: Dict[str, Any],
) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    for field in (part.fields or []):
        field_id = field.get("id")
        if field_id and field_id in questionnaire_answers:
            summary[field_id] = questionnaire_answers[field_id]
    return summary
