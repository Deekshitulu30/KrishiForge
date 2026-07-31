import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Submission, FarmPlot, Plan
from app.services.weather_service import get_weather_data
from app.services.llm_service import generate_regenerative_plan, generate_plan_streaming, _parse_json_response

router = APIRouter(prefix="/generate", tags=["Generative Plan Engine"])

def _load_submission_and_plot(submission_id: int, db: Session):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")
    plot = db.query(FarmPlot).filter(FarmPlot.id == submission.plot_id).first()
    if not plot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"FarmPlot for submission {submission_id} not found")
    return submission, plot

def _parse_cv(submission) -> list:
    if not submission.raw_cv_prediction:
        return []
    try:
        return json.loads(submission.raw_cv_prediction)
    except Exception:
        return [{"raw": submission.raw_cv_prediction}]

def _save_plan(db: Session, submission_id: int, plan_dict: dict, raw_prompt: str) -> Plan:
    plan_json = json.dumps(plan_dict)
    existing = db.query(Plan).filter(Plan.submission_id == submission_id).first()
    if existing:
        existing.plan_text = plan_json
        existing.raw_prompt = raw_prompt
        plan_record = existing
    else:
        plan_record = Plan(submission_id=submission_id, plan_text=plan_json, raw_prompt=raw_prompt)
        db.add(plan_record)
    db.commit()
    db.refresh(plan_record)
    return plan_record

@router.post("/plan/{submission_id}")
def generate_plan_blocking(submission_id: int, db: Session = Depends(get_db)):
    """Blocking endpoint — use /stream for real-time progressive output."""
    submission, plot = _load_submission_and_plot(submission_id, db)
    cv_prediction = _parse_cv(submission)
    weather_payload = get_weather_data(plot.latitude, plot.longitude)

    plan_dict, raw_prompt = generate_regenerative_plan(
        crop_name=plot.crop_name, soil_type=plot.soil_type,
        area_acres=plot.area_acres, soil_moisture=submission.soil_moisture_percent,
        last_irrigation=submission.last_irrigation_date, farmer_notes=submission.notes,
        cv_prediction=cv_prediction, weather_data=weather_payload
    )
    plan_record = _save_plan(db, submission_id, plan_dict, raw_prompt)
    return {"id": plan_record.id, "submission_id": plan_record.submission_id, "plan": plan_dict, "created_at": plan_record.created_at}

@router.get("/plan/{submission_id}/stream")
def generate_plan_stream(submission_id: int, db: Session = Depends(get_db)):
    """
    Streaming SSE endpoint. Frontend listens with EventSource to receive tokens in real-time.
    Saves the assembled plan to DB when Ollama marks done=true.
    """
    submission, plot = _load_submission_and_plot(submission_id, db)
    cv_prediction = _parse_cv(submission)
    weather_payload = get_weather_data(plot.latitude, plot.longitude)

    accumulated_tokens = []

    def event_stream():
        for chunk in generate_plan_streaming(
            crop_name=plot.crop_name, soil_type=plot.soil_type,
            area_acres=plot.area_acres, soil_moisture=submission.soil_moisture_percent,
            last_irrigation=submission.last_irrigation_date, farmer_notes=submission.notes,
            cv_prediction=cv_prediction, weather_data=weather_payload
        ):
            # Parse to track accumulated text for DB save
            try:
                data = json.loads(chunk.replace("data: ", "").strip())
                if not data.get("error"):
                    accumulated_tokens.append(data.get("token", ""))
                    if data.get("done"):
                        # Assemble full JSON and save to DB
                        full_text = "".join(accumulated_tokens)
                        try:
                            plan_dict = _parse_json_response(full_text)
                            plan_record = _save_plan(db, submission_id, plan_dict, "streamed")
                            # Send final event with plan_id
                            yield f"data: {json.dumps({'done': True, 'plan_id': plan_record.id})}\n\n"
                        except Exception as e:
                            yield f"data: {json.dumps({'error': f'JSON parse error: {str(e)}'})}\n\n"
                        return
            except Exception:
                pass
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
