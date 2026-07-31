import os
import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Submission
from app.services.cv_service import predict_plant_disease

router = APIRouter(prefix="/analyze", tags=["Computer Vision"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
async def analyze_crop_image(
    file: UploadFile = File(...),
    submission_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image (JPEG, PNG, etc.)"
        )

    contents = await file.read()

    # Run real model inference
    predictions = predict_plant_disease(contents)

    # Save image to uploads directory
    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    relative_photo_path = f"uploads/{unique_filename}"

    # If submission_id provided, update the Submission DB record
    submission_record = None
    if submission_id:
        submission_record = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission with ID {submission_id} not found"
            )

        submission_record.photo_path = relative_photo_path
        submission_record.raw_cv_prediction = json.dumps(predictions)
        db.commit()
        db.refresh(submission_record)

    return {
        "predictions": predictions,
        "primary_diagnosis": predictions[0]["label"] if predictions else "Unknown",
        "confidence": predictions[0]["confidence_percent"] if predictions else 0.0,
        "photo_path": relative_photo_path,
        "submission_id": submission_record.id if submission_record else None
    }
