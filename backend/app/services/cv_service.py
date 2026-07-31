import io
import logging
from PIL import Image
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Diginsa model: ResNet-based, 38-class PlantVillage (full dataset).
# Public, no auth required. Covers Apple, Corn, Grape, Pepper, Potato,
# Tomato, Strawberry, Peach, Cherry, Soybean, Squash + healthy variants.
# On real diseased leaf photos: top-1 confidence typically 70-98%.
# Low scores on plain green/white images are EXPECTED (no disease pattern).
MODEL_NAME = "Diginsa/Plant-Disease-Detection-Project"

_classifier_pipeline = None


def get_cv_pipeline():
    global _classifier_pipeline
    if _classifier_pipeline is None:
        try:
            from transformers import pipeline as hf_pipeline
            logger.info(f"Loading CV model '{MODEL_NAME}'...")
            _classifier_pipeline = hf_pipeline(
                "image-classification",
                model=MODEL_NAME,
            )
            logger.info(
                f"CV model loaded — "
                f"{len(_classifier_pipeline.model.config.id2label)} disease classes."
            )
        except Exception as exc:
            logger.error(f"Failed to load plant disease CV model: {exc}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Plant disease CV model failed to load: {str(exc)}"
            )
    return _classifier_pipeline


def _preprocess_image(img: Image.Image) -> Image.Image:
    """
    Scale shortest side to 256 then center-crop to 224×224.
    Matches PlantVillage training preprocessing for ResNet / ViT models.
    """
    TARGET = 224
    w, h = img.size
    scale = 256 / min(w, h)
    img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    nw, nh = img.size
    left = (nw - TARGET) // 2
    top = (nh - TARGET) // 2
    return img.crop((left, top, left + TARGET, top + TARGET))


def predict_plant_disease(image_bytes: bytes, top_k: int = 5):
    classifier = get_cv_pipeline()
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = _preprocess_image(img)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or unreadable image: {str(exc)}"
        )
    try:
        raw = classifier(img, top_k=top_k)
        return [
            {
                "label": r["label"],
                "score": round(float(r["score"]), 4),
                "confidence_percent": round(float(r["score"]) * 100, 2),
            }
            for r in raw
        ]
    except Exception as exc:
        logger.error(f"CV inference error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image classification failed: {str(exc)}"
        )
