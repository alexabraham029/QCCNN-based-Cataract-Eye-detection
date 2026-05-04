"""
Inference helper for the trained QCNN model.
"""

import math
import time
import torch
from PIL import Image

from model.qcnn_model import HybridQCNN, N_QUBITS, N_LAYERS
from utils.preprocess import preprocess_single

LABELS = {0: "Normal", 1: "Cataract"}


def predict_image(model: HybridQCNN, pil_img: Image.Image) -> dict:
    """
    Run inference on a single PIL image.
    Returns label, confidence, per-class probabilities, and circuit info.
    """
    tensor = preprocess_single(pil_img, use_clahe=True)   # [1, 3, 224, 224]

    model.eval()
    with torch.no_grad():
        output = model(tensor)          # [1, 1] — probability of Cataract

    prob_cataract = float(output.item())
    prob_normal   = 1.0 - prob_cataract
    label_idx     = 1 if prob_cataract > 0.5 else 0
    confidence    = max(prob_cataract, prob_normal)

    return {
        "label":       LABELS[label_idx],
        "confidence":  round(confidence, 4),
        "probabilities": {
            "Cataract": round(prob_cataract, 4),
            "Normal":   round(prob_normal,   4),
        },
        "circuit_info": {
            "n_qubits":         N_QUBITS,
            "n_layers":         N_LAYERS,
            "embedding":        "AngleEmbedding (Ry rotation)",
            "ansatz":           "StronglyEntanglingLayers",
            "measurement":      "PauliZ expectation values",
            "trainable_params": N_LAYERS * N_QUBITS * 3,   # 24
            "circuit_depth":    N_LAYERS * (N_QUBITS + N_QUBITS - 1),
        },
    }
