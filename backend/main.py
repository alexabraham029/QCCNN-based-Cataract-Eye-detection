"""
FastAPI backend for QCNN Cataract Detection.
Endpoints:
  POST /predict  — upload eye image → get diagnosis
  GET  /metrics  — model performance statistics
  GET  /health   — server + model status
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"   # Fix OMP Error #15 on Windows/Anaconda

import io
import json
import time
import random
from pathlib import Path

import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# ── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="QCNN Cataract Detection API",
    description="Hybrid Quantum-Classical CNN for cataract diagnosis from eye images.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent
WEIGHTS_PATH = BASE_DIR / "model" / "saved_model" / "qcnn_weights.pt"
METRICS_PATH = BASE_DIR / "model" / "saved_model" / "metrics.json"

model     = None
demo_mode = True

# ── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def load_model():
    global model, demo_mode
    if WEIGHTS_PATH.exists():
        try:
            from model.qcnn_model import HybridQCNN
            model = HybridQCNN(freeze_backbone=False)
            model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
            model.eval()
            demo_mode = False
            print("[OK] Trained QCNN model loaded.")
        except Exception as e:
            print(f"[WARN] Could not load model ({e}). Running in demo mode.")
    else:
        print("[INFO] No trained weights found. Running in demo mode.")
        print("       Train first: python -m model.train --data_dir dataset/train")


# ── Helpers ──────────────────────────────────────────────────────────────────
def _demo_predict(pil_img: Image.Image) -> dict:
    """
    Deterministic demo prediction based on image statistics.
    Used when no trained model is available.
    """
    arr = np.array(pil_img.resize((64, 64)), dtype=np.float32)
    brightness = arr.mean() / 255.0
    seed = int(arr.sum()) % 100_000
    rng = random.Random(seed)

    # Simulate a believable prediction
    confidence = round(rng.uniform(0.74, 0.97), 4)
    # Slightly hazy (low brightness) images → lean cataract
    label = "Cataract" if brightness < 0.48 else "Normal"
    p_cat = confidence if label == "Cataract" else round(1 - confidence, 4)
    p_nor = round(1 - p_cat, 4)

    return {
        "label":       label,
        "confidence":  confidence,
        "probabilities": {"Cataract": p_cat, "Normal": p_nor},
        "circuit_info": {
            "n_qubits":         4,
            "n_layers":         2,
            "embedding":        "AngleEmbedding (Ry rotation)",
            "ansatz":           "StronglyEntanglingLayers",
            "measurement":      "PauliZ expectation values",
            "trainable_params": 24,
            "circuit_depth":    14,
        },
    }


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":       "ok",
        "demo_mode":    demo_mode,
        "model_loaded": not demo_mode,
        "message":      "Demo mode — upload any eye image to see a simulated prediction." if demo_mode
                        else "Trained QCNN model is loaded and ready.",
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/bmp", "image/tiff"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400,
                            detail=f"Unsupported file type: {file.content_type}. Use JPEG or PNG.")

    try:
        contents = await file.read()
        pil_img  = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image. Ensure it is a valid image file.")

    t0 = time.time()

    if demo_mode:
        result = _demo_predict(pil_img)
    else:
        from model.predict import predict_image
        result = predict_image(model, pil_img)

    result["inference_time_ms"] = round((time.time() - t0) * 1000, 2)
    result["demo_mode"]         = demo_mode

    return JSONResponse(content=result)


@app.get("/metrics")
def metrics():
    if METRICS_PATH.exists():
        with open(METRICS_PATH) as f:
            return json.load(f)

    # Demo metrics (representative of published QCNN results on eye datasets)
    return {
        "demo_mode":    True,
        "accuracy":     0.8921,
        "precision":    0.8876,
        "recall":       0.8974,
        "f1_score":     0.8925,
        "auc_roc":      0.9418,
        "n_test_samples": 423,
        "training_epochs": 30,
        "n_qubits":     4,
        "n_layers":     2,
        "trainable_params": 847,
        "note": "Demo statistics. Train the model to see actual results.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
