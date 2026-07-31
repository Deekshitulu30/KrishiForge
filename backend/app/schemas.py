from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class FarmerBase(BaseModel):
    name: str
    phone: Optional[str] = None

class FarmerCreate(FarmerBase):
    pass

class FarmerResponse(FarmerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FarmPlotBase(BaseModel):
    crop_name: str
    latitude: float
    longitude: float
    soil_type: str
    area_acres: Optional[float] = None

class FarmPlotCreate(FarmPlotBase):
    farmer_id: int

class FarmPlotResponse(FarmPlotBase):
    id: int
    farmer_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubmissionBase(BaseModel):
    soil_moisture_percent: Optional[float] = None
    last_irrigation_date: Optional[str] = None
    notes: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    plot_id: int

class SubmissionResponse(SubmissionBase):
    id: int
    plot_id: int
    photo_path: Optional[str] = None
    raw_cv_prediction: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PlanResponse(BaseModel):
    id: int
    submission_id: int
    plan_text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FeedbackCreate(BaseModel):
    plan_id: int
    rating: int
    outcome_notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    plan_id: int
    rating: int
    outcome_notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
