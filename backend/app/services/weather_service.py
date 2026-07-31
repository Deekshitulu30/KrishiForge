import time
import logging
from typing import Dict, Any
import httpx
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# 2-hour TTL cache: (round(lat, 2), round(lon, 2)) -> (timestamp, data_dict)
_WEATHER_CACHE: Dict[tuple, tuple] = {}
CACHE_TTL_SECONDS = 7200

def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    cache_key = (round(latitude, 2), round(longitude, 2))
    now = time.time()

    if cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            logger.info(f"Returning cached weather data for coordinates {cache_key}")
            return cached_data

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "weather_code"],
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "relative_humidity_2m_mean"],
        "timezone": "auto"
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            raw_data = response.json()
    except Exception as exc:
        logger.error(f"Open-Meteo API call failed for lat={latitude}, lon={longitude}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch live weather from Open-Meteo: {str(exc)}"
        )

    processed_data = process_weather_and_calculate_risks(raw_data)
    _WEATHER_CACHE[cache_key] = (now, processed_data)
    return processed_data

def process_weather_and_calculate_risks(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes transparent, biologically defensible agronomic risk scores based on live forecast metrics.
    """
    current = raw_data.get("current", {})
    daily = raw_data.get("daily", {})

    curr_temp = current.get("temperature_2m", 25.0)
    curr_humidity = current.get("relative_humidity_2m", 60.0)
    curr_precip = current.get("precipitation", 0.0)

    daily_temps_max = daily.get("temperature_2m_max", [])
    daily_precip_sum = daily.get("precipitation_sum", [])
    daily_humidity_mean = daily.get("relative_humidity_2m_mean", [])

    total_7day_rain = sum(daily_precip_sum) if daily_precip_sum else 0.0
    max_7day_temp = max(daily_temps_max) if daily_temps_max else curr_temp
    avg_7day_humidity = sum(daily_humidity_mean) / len(daily_humidity_mean) if daily_humidity_mean else curr_humidity

    risk_flags = []

    # 1. Fungal Spore Infection Risk Threshold
    # Rule: Mean humidity > 75% or current humidity > 80% with rain > 5mm
    # Agronomic Basis: Spore germination for Phytophthora / Septoria / Rust requires relative humidity >= 75-80%
    if curr_humidity >= 80.0 or (avg_7day_humidity >= 75.0 and total_7day_rain >= 5.0):
        risk_flags.append({
            "risk_type": "FUNGAL_GROWTH_RISK",
            "severity": "HIGH" if curr_humidity >= 85.0 else "MEDIUM",
            "reason": f"High humidity ({curr_humidity}%) and rainfall ({total_7day_rain:.1f}mm) create ideal conditions for fungal leaf blights and mildew spore germination."
        })

    # 2. Drought & Soil Moisture Deficit Risk Threshold
    # Rule: 7-day total rain < 5mm AND max temperature > 32°C
    # Agronomic Basis: Low rainfall combined with high evapotranspiration reduces turgor pressure and induces moisture stress.
    if total_7day_rain < 5.0 and max_7day_temp >= 32.0:
        risk_flags.append({
            "risk_type": "DROUGHT_STRESS_RISK",
            "severity": "HIGH" if max_7day_temp >= 36.0 else "MEDIUM",
            "reason": f"Low 7-day total precipitation ({total_7day_rain:.1f}mm) and high peak temp ({max_7day_temp}°C) indicate high evapotranspiration and soil drying."
        })

    # 3. Heat Stress Risk Threshold
    # Rule: Max temp >= 38°C
    # Agronomic Basis: Thermal stress denatures photosynthetic enzymes and lowers crop pollen viability.
    if max_7day_temp >= 38.0:
        risk_flags.append({
            "risk_type": "EXTREME_HEAT_RISK",
            "severity": "HIGH",
            "reason": f"Extreme peak temperature ({max_7day_temp}°C) recorded. High risk of heat-induced flower drop and cellular dehydration."
        })

    return {
        "current": {
            "temperature_celsius": curr_temp,
            "relative_humidity_percent": curr_humidity,
            "precipitation_mm": curr_precip,
            "weather_code": current.get("weather_code", 0)
        },
        "forecast_7day": {
            "max_temperature_celsius": max_7day_temp,
            "total_precipitation_mm": round(total_7day_rain, 2),
            "average_humidity_percent": round(avg_7day_humidity, 2)
        },
        "risk_flags": risk_flags
    }
