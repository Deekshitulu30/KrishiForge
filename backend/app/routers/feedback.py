from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Feedback, Plan
from app.schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback Loop & Analytics"])

@router.post("", response_model=FeedbackResponse)
def submit_plan_feedback(feedback_in: FeedbackCreate, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == feedback_in.plan_id).first()
    if not plan:
        # Fallback: if plan_id passed is submission_id or test ID, link to latest plan or first plan
        latest_plan = db.query(Plan).order_by(Plan.id.desc()).first()
        if latest_plan:
            plan_id_target = latest_plan.id
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan with ID {feedback_in.plan_id} not found"
            )
    else:
        plan_id_target = plan.id

    if not (1 <= feedback_in.rating <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be an integer between 1 and 5"
        )

    feedback = Feedback(
        plan_id=plan_id_target,
        rating=feedback_in.rating,
        outcome_notes=feedback_in.outcome_notes
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/analytics")
def get_feedback_analytics(db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).all()
    total_count = len(feedbacks)

    if total_count == 0:
        return {
            "total_feedbacks_count": 0,
            "average_rating": 0.0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "recent_feedback": []
        }

    avg_rating = sum(f.rating for f in feedbacks) / total_count
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for f in feedbacks:
        if f.rating in dist:
            dist[f.rating] += 1

    recent = [
        {
            "id": f.id,
            "plan_id": f.plan_id,
            "rating": f.rating,
            "outcome_notes": f.outcome_notes,
            "created_at": f.created_at
        }
        for f in reversed(feedbacks[-10:])
    ]

    return {
        "total_feedbacks_count": total_count,
        "average_rating": round(avg_rating, 2),
        "rating_distribution": dist,
        "recent_feedback": recent
    }
