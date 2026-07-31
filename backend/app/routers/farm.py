from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Farmer, FarmPlot
from app.schemas import FarmerCreate, FarmerResponse, FarmPlotCreate, FarmPlotResponse

router = APIRouter(tags=["Farm & Plot Management"])

@router.post("/farmers", response_model=FarmerResponse)
def create_farmer(farmer_in: FarmerCreate, db: Session = Depends(get_db)):
    farmer = Farmer(name=farmer_in.name, phone=farmer_in.phone)
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer

@router.get("/farmers", response_model=List[FarmerResponse])
def list_farmers(db: Session = Depends(get_db)):
    return db.query(Farmer).all()

@router.post("/plots", response_model=FarmPlotResponse)
def create_farm_plot(plot_in: FarmPlotCreate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == plot_in.farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {plot_in.farmer_id} not found"
        )
    plot = FarmPlot(
        farmer_id=plot_in.farmer_id,
        crop_name=plot_in.crop_name,
        latitude=plot_in.latitude,
        longitude=plot_in.longitude,
        soil_type=plot_in.soil_type,
        area_acres=plot_in.area_acres
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return plot

@router.get("/plots", response_model=List[FarmPlotResponse])
def list_farm_plots(db: Session = Depends(get_db)):
    return db.query(FarmPlot).order_by(FarmPlot.id.desc()).all()

@router.get("/plots/{plot_id}", response_model=FarmPlotResponse)
def get_farm_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(FarmPlot).filter(FarmPlot.id == plot_id).first()
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm plot with ID {plot_id} not found"
        )
    return plot
