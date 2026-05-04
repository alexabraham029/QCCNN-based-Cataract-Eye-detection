"""
Image preprocessing utilities for fundus / eye-disease images.
Applies CLAHE contrast enhancement before standard CNN normalization.
"""

import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms

# ImageNet normalization constants
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

# ── CLAHE Enhancement ────────────────────────────────────────────────────────

def apply_clahe(pil_img: Image.Image, clip_limit: float = 2.0,
                tile_grid: tuple = (8, 8)) -> Image.Image:
    """
    Apply Contrast-Limited Adaptive Histogram Equalization (CLAHE).
    Improves local contrast in fundus images, making cataract features clearer.
    """
    img_np = np.array(pil_img.convert("RGB"))
    lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid)
    l_enhanced = clahe.apply(l)

    lab_enhanced = cv2.merge([l_enhanced, a, b])
    rgb_enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2RGB)
    return Image.fromarray(rgb_enhanced)


# ── Transforms ───────────────────────────────────────────────────────────────

def get_train_transform() -> transforms.Compose:
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
    ])


def get_val_transform() -> transforms.Compose:
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
    ])


def preprocess_single(pil_img: Image.Image,
                       use_clahe: bool = True) -> torch.Tensor:
    """
    Preprocess a single PIL image for inference.
    Returns a [1, 3, 224, 224] tensor ready for the model.
    """
    img = pil_img.convert("RGB")
    if use_clahe:
        img = apply_clahe(img)
    transform = get_val_transform()
    return transform(img).unsqueeze(0)
