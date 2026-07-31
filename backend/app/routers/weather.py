from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FarmPlot
from app.services.weather_service import get_weather_data

router = APIRouter(prefix="/weather", tags=["Weather & Risk"])

@router.get("/{plot_id}")
def get_plot_weather_and_risks(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(FarmPlot).filter(FarmPlot.id == plot_id).first()
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm plot with ID {plot_id} not found"
        )

    weather_payload = get_weather_data(plot.latitude, plot.longitude)

    return {
        "plot_id": plot.id,
        "crop_name": plot.crop_name,
        "coordinates": {
            "latitude": plot.latitude,
            "longitude": plot.longitude
        },
        "weather": weather_payload
    }
