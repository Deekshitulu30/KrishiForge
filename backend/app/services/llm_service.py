import json
import logging
from typing import Dict, Any, Generator
import httpx
from fastapi import HTTPException, status
from app.config import settings
from app.services.rag_service import retrieve_context

logger = logging.getLogger(__name__)

# Compact system prompt — shorter = fewer tokens to attend over = faster generation
SYSTEM_PROMPT = (
    "You are a regenerative agriculture expert. "
    "Reply ONLY with a single valid JSON object — no markdown, no preamble. "
    "Schema:\n"
    '{"diagnosis_summary":"string","weather_risk_summary":"string",'
    '"immediate_actions":["string"],"soil_moisture_plan":"string",'
    '"weekly_timeline":[{"week":1,"actions":["string"]},{"week":2,"actions":["string"]},'
    '{"week":3,"actions":["string"]},{"week":4,"actions":["string"]}],'
    '"bio_inputs":["string"],"budget_estimate":"string","confidence_notes":"string"}'
)

# Ollama generation options — these are the main speed levers
OLLAMA_OPTIONS = {
    "num_predict": 700,   # hard cap on output tokens (~500 words) — was unlimited
    "num_ctx": 2048,      # context window — was default 4096, halving it cuts attention time ~4x
    "temperature": 0.4,   # slightly lower = more decisive, fewer stalls
    "top_p": 0.85,
    "repeat_penalty": 1.1,
}


def _ollama_url() -> str:
    host = settings.OLLAMA_HOST.strip().rstrip("/")
    if not host.startswith("http"):
        host = f"http://{host}"
    return f"{host}/api/generate"


def _build_prompt(crop, soil, acres, moisture, last_irr, notes, cv, weather) -> str:
    cv_str = json.dumps(cv[:3], indent=None) if cv else "none"
    w = weather or {}
    cur = w.get("current", {})
    risk_count = len(w.get("risk_flags", []))
    # Compact weather block — only include what the LLM actually needs
    weather_str = (
        f"Temp:{cur.get('temperature_celsius','?')}C "
        f"Humidity:{cur.get('relative_humidity_percent','?')}% "
        f"Rain7d:{w.get('forecast_7day',{}).get('total_precipitation_mm','?')}mm "
        f"RiskFlags:{risk_count}"
    )

    primary = cv[0].get("label", "") if cv else ""
    rag = retrieve_context(f"{crop} {primary} {soil} organic bio-inputs", top_k=2)
    rag_block = rag[:600] if rag else "No RAG docs."   # truncate RAG to 600 chars max

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Crop:{crop} Soil:{soil} Acres:{acres or '?'} Moisture:{moisture or '?'}% "
        f"LastIrr:{last_irr or '?'} Notes:{notes or 'none'}\n"
        f"CV:{cv_str}\n"
        f"Weather:{weather_str}\n"
        f"AgriDocs:{rag_block}\n\n"
        "JSON:"
    )


def generate_regenerative_plan(
    crop_name, soil_type, area_acres, soil_moisture,
    last_irrigation, farmer_notes, cv_prediction, weather_data
) -> tuple[Dict[str, Any], str]:
    prompt = _build_prompt(
        crop_name, soil_type, area_acres, soil_moisture,
        last_irrigation, farmer_notes, cv_prediction, weather_data
    )
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": OLLAMA_OPTIONS,
    }
    try:
        with httpx.Client(timeout=90.0) as client:
            resp = client.post(_ollama_url(), json=payload)
            resp.raise_for_status()
            raw = resp.json().get("response", "")
    except (httpx.ConnectError, httpx.ConnectTimeout):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ollama unreachable at '{_ollama_url()}'. Ensure Ollama is running."
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ollama error: {str(exc)}"
        )
    return _parse_json_response(raw), prompt


def generate_plan_streaming(
    crop_name, soil_type, area_acres, soil_moisture,
    last_irrigation, farmer_notes, cv_prediction, weather_data
) -> Generator[str, None, None]:
    """
    Yields SSE data chunks. Frontend uses EventSource to stream tokens.
    Much faster UX — user sees output within 2-3 seconds.
    """
    prompt = _build_prompt(
        crop_name, soil_type, area_acres, soil_moisture,
        last_irrigation, farmer_notes, cv_prediction, weather_data
    )
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "format": "json",
        "options": OLLAMA_OPTIONS,
    }
    try:
        with httpx.Client(timeout=120.0) as client:
            with client.stream("POST", _ollama_url(), json=payload) as resp:
                resp.raise_for_status()
                for line in resp.iter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("response", "")
                        done = chunk.get("done", False)
                        yield f"data: {json.dumps({'token': token, 'done': done})}\n\n"
                        if done:
                            break
                    except json.JSONDecodeError:
                        continue
    except (httpx.ConnectError, httpx.ConnectTimeout):
        yield f"data: {json.dumps({'error': 'Ollama unreachable. Is it running?'})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


def _parse_json_response(raw: str) -> Dict[str, Any]:
    clean = raw.strip().lstrip("```json").rstrip("```").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama returned invalid JSON: {raw[:300]}"
        )
