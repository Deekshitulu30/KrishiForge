from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Plan, Submission, FarmPlot
from app.services.pdf_service import generate_plan_pdf

router = APIRouter(prefix="/plan", tags=["PDF Export"])

@router.get("/{plan_id}/pdf")
def export_plan_pdf(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found"
        )

    submission = db.query(Submission).filter(Submission.id == plan.submission_id).first()
    plot = db.query(FarmPlot).filter(FarmPlot.id == submission.plot_id).first() if submission else None

    try:
        pdf_bytes = generate_plan_pdf(plan, submission, plot)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=KrishiForge_Plan_{plan_id}.pdf"
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF rendering failed: {str(exc)}"
        )
