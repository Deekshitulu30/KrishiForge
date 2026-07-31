from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.services.rag_service import ingest_pdf_bytes, ingest_text_document, get_chroma_collection

router = APIRouter(prefix="/knowledge", tags=["RAG Knowledge Base"])

@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename or "uploaded_document"

    if filename.endswith(".pdf"):
        chunk_count = ingest_pdf_bytes(contents, filename)
    elif filename.endswith(".txt") or filename.endswith(".md"):
        text_str = contents.decode("utf-8", errors="ignore")
        chunk_count = ingest_text_document(text_str, filename)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported document types for ingestion are .pdf, .txt, .md"
        )

    return {
        "status": "success",
        "filename": filename,
        "chunks_ingested": chunk_count,
        "message": f"Successfully ingested {chunk_count} text chunks into local ChromaDB knowledge base."
    }

@router.get("/status")
def get_knowledge_base_status():
    collection = get_chroma_collection()
    total_chunks = collection.count()
    return {
        "collection_name": collection.name,
        "total_chunks_ingested": total_chunks
    }
