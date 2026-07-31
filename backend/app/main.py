import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import health, cv, weather, plan, knowledge, farm, pdf, feedback

app = FastAPI(
    title="KrishiForge AI API",
    version="1.0.0",
    description="Backend services for KrishiForge AI regenerative farming advisor"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

app.include_router(health.router)
app.include_router(farm.router)
app.include_router(cv.router)
app.include_router(weather.router)
app.include_router(plan.router)
app.include_router(knowledge.router)
app.include_router(pdf.router)
app.include_router(feedback.router)

@app.get("/")
def root():
    return {
        "message": "KrishiForge AI API v1.0 is fully active",
        "health": "/health",
        "farmers": "/farmers",
        "plots": "/plots",
        "analyze_image": "/analyze/image",
        "weather": "/weather/{plot_id}",
        "generate_plan": "/generate/plan/{submission_id}",
        "pdf_download": "/plan/{plan_id}/pdf",
        "feedback": "/feedback",
        "feedback_analytics": "/feedback/analytics"
    }
