import os
import sys
import argparse

# Add backend parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_service import ingest_pdf_bytes, ingest_text_document

def main():
    parser = argparse.ArgumentParser(description="KrishiForge RAG Knowledge Base Document Ingestion CLI")
    parser.add_argument("--file", "-f", required=True, help="Path to reference PDF or TXT document")
    args = parser.parse_args()

    file_path = os.path.abspath(args.file)
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)

    filename = os.path.basename(file_path)
    print(f"Reading file '{filename}'...")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    if filename.lower().endswith(".pdf"):
        chunk_count = ingest_pdf_bytes(file_bytes, filename)
    else:
        text_str = file_bytes.decode("utf-8", errors="ignore")
        chunk_count = ingest_text_document(text_str, filename)

    print(f"SUCCESS: Ingested {chunk_count} chunks from '{filename}' into ChromaDB at ./chroma_db")

if __name__ == "__main__":
    main()
