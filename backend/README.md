# KrishiForge AI - Backend

FastAPI backend service for KrishiForge AI regenerative agriculture advisor.

## Architecture

- **Framework**: FastAPI
- **Config**: `pydantic-settings` reading from `.env`
- **ORM & Database**: SQLAlchemy 2.0 with SQLite for dev (`krishiforge.db`), Postgres-ready
- **Migrations**: Alembic
- **Computer Vision**: Pretrained Vision Transformer (`dima806/plant_disease_image_detection`) via Hugging Face `transformers`

## Machine Resources & Model Benchmarks

> [!NOTE]
> **Computer Vision Model Details (`dima806/plant_disease_image_detection`)**
> - **Size on Disk**: ~340 MB (downloads automatically to `~/.cache/huggingface/` on first inference request).
> - **First-load Warmup Time**: ~3–5 seconds on local CPU / RTX 3050 GPU.
> - **Per-image Inference Speed**: ~150ms–400ms.
> - **Classification Scope**: Detects 38 distinct agricultural disease/health conditions across tomato, potato, apple, corn, grape, peach, pepper, squash, strawberry, etc.

## Setup & Running

1. **Install Dependencies**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   DATABASE_URL=sqlite:///./krishiforge.db
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   CHROMA_PATH=./chroma_db
   ```

3. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start Development Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Endpoints**:
   - `GET /health`: Database connectivity ping
   - `POST /analyze/image`: Upload leaf photo (`multipart/form-data`) to predict plant disease classes and confidence.
