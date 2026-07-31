from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plots = relationship("FarmPlot", back_populates="farmer", cascade="all, delete-orphan")

class FarmPlot(Base):
    __tablename__ = "farm_plots"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String, nullable=False)
    area_acres = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("Farmer", back_populates="plots")
    submissions = relationship("Submission", back_populates="plot", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("farm_plots.id"), nullable=False)
    photo_path = Column(String, nullable=True)
    soil_moisture_percent = Column(Float, nullable=True)
    last_irrigation_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    raw_cv_prediction = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plot = relationship("FarmPlot", back_populates="submissions")
    plan = relationship("Plan", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, unique=True)
    plan_text = Column(Text, nullable=False)
    raw_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submission = relationship("Submission", back_populates="plan")
    feedbacks = relationship("Feedback", back_populates="plan", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    outcome_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("Plan", back_populates="feedbacks")
