"""
Quick confidence test with the selected model on a textured leaf-like image.
"""
from PIL import Image, ImageDraw
import random, io
from transformers import pipeline as hf_pipeline

MODEL = "Diginsa/Plant-Disease-Detection-Project"

# Create a more realistic test image: green with brown spots (simulates disease)
img = Image.new("RGB", (400, 400), color=(72, 130, 55))
draw = ImageDraw.Draw(img)
random.seed(42)
for _ in range(30):
    x, y = random.randint(20, 380), random.randint(20, 380)
    r = random.randint(5, 25)
    draw.ellipse([x-r, y-r, x+r, y+r], fill=(140, 80, 30))  # brown disease spots

print(f"Loading {MODEL}...")
clf = hf_pipeline("image-classification", model=MODEL)
print(f"Loaded. Labels: {len(clf.model.config.id2label)}")

results = clf(img, top_k=5)
print("\nTop predictions on simulated diseased leaf (green + brown spots):")
for r in results:
    bar = "█" * int(r["score"] * 40)
    print(f"  {r['label'][:45]:45s}  {r['score']*100:5.1f}%  {bar}")

print("\nAll 38 labels available:")
for i, label in clf.model.config.id2label.items():
    print(f"  {i:2d}: {label}")
