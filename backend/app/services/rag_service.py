import os
import io
import uuid
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

_chroma_client = None
_collection = None

def get_chroma_collection():
    global _chroma_client, _collection
    if _collection is None:
        import chromadb
        chroma_path = os.path.abspath(settings.CHROMA_PATH)
        os.makedirs(chroma_path, exist_ok=True)
        logger.info(f"Initializing persistent ChromaDB client at '{chroma_path}'...")
        _chroma_client = chromadb.PersistentClient(path=chroma_path)
        _collection = _chroma_client.get_or_create_collection(
            name="krishiforge_agri_kb",
            metadata={"hnsw:space": "cosine"}
        )
    return _collection

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def ingest_text_document(text_content: str, doc_name: str) -> int:
    collection = get_chroma_collection()
    chunks = chunk_text(text_content)
    if not chunks:
        return 0

    ids = [f"{doc_name}_{uuid.uuid4().hex[:8]}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": doc_name, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )
    logger.info(f"Ingested {len(chunks)} chunks from document '{doc_name}' into ChromaDB.")
    return len(chunks)

def ingest_pdf_bytes(pdf_bytes: bytes, filename: str) -> int:
    from pypdf import PdfReader
    pdf_file = io.BytesIO(pdf_bytes)
    reader = PdfReader(pdf_file)
    extracted_text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            extracted_text += page_text + "\n"

    if not extracted_text.strip():
        logger.warning(f"No extractable text found in PDF '{filename}'.")
        return 0

    return ingest_text_document(extracted_text, filename)

def retrieve_context(query: str, top_k: int = 3) -> str:
    try:
        collection = get_chroma_collection()
        count = collection.count()
        if count == 0:
            logger.info("ChromaDB knowledge base is currently empty.")
            return ""

        results = collection.query(
            query_texts=[query],
            n_results=min(top_k, count)
        )

        documents = results.get("documents", [[]])[0]
        if not documents:
            return ""

        joined_context = "\n---\n".join(documents)
        return joined_context
    except Exception as exc:
        logger.error(f"RAG retrieval error: {exc}")
        return ""
