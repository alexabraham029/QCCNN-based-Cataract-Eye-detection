"""
Dataset loader for Eye Diseases Classification dataset.
Filters to binary task: Cataract (1) vs Normal (0).
"""

import os
from pathlib import Path
from typing import Tuple

import torch
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import datasets
from PIL import Image

from utils.preprocess import get_train_transform, get_val_transform, apply_clahe


class BinaryCataractDataset(Dataset):
    """
    Wraps ImageFolder and re-labels to binary: Cataract=1, Normal=0.
    Handles various folder-name conventions (case-insensitive).
    """

    CATARACT_KEYWORDS = ["cataract"]
    NORMAL_KEYWORDS   = ["normal"]

    def __init__(self, root_dir: str, transform=None, use_clahe: bool = True):
        self.transform  = transform
        self.use_clahe  = use_clahe
        self.samples    = []   # list of (path, binary_label)

        root = Path(root_dir)
        if not root.exists():
            raise FileNotFoundError(f"Dataset directory not found: {root_dir}")

        supported = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}

        for cls_dir in sorted(root.iterdir()):
            if not cls_dir.is_dir():
                continue
            name = cls_dir.name.lower()

            if any(k in name for k in self.CATARACT_KEYWORDS):
                label = 1
            elif any(k in name for k in self.NORMAL_KEYWORDS):
                label = 0
            else:
                continue   # skip diabetic_retinopathy, glaucoma, etc.

            for img_path in cls_dir.rglob("*"):
                if img_path.suffix.lower() in supported:
                    self.samples.append((str(img_path), label))

        if len(self.samples) == 0:
            raise RuntimeError(
                f"No cataract/normal images found in {root_dir}.\n"
                "Expected sub-folders containing 'cataract' or 'normal' in their name."
            )

        n_cat = sum(1 for _, l in self.samples if l == 1)
        n_nor = sum(1 for _, l in self.samples if l == 0)
        print(f"Dataset loaded — Cataract: {n_cat}, Normal: {n_nor}, Total: {len(self.samples)}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.use_clahe:
            img = apply_clahe(img)
        if self.transform:
            img = self.transform(img)
        return img, torch.tensor(label, dtype=torch.float32)


def get_data_loaders(
    data_dir: str,
    val_split: float = 0.2,
    batch_size: int = 8,
    num_workers: int = 0,
) -> Tuple[DataLoader, DataLoader]:
    """
    Build train and validation DataLoaders from the dataset directory.
    """
    train_tf = get_train_transform()
    val_tf   = get_val_transform()

    # Load full dataset with train transforms first (we'll re-apply val transforms later)
    full_ds = BinaryCataractDataset(data_dir, transform=train_tf, use_clahe=True)

    val_size   = int(len(full_ds) * val_split)
    train_size = len(full_ds) - val_size
    train_ds, val_ds = random_split(
        full_ds, [train_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                              num_workers=num_workers, pin_memory=False)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False,
                              num_workers=num_workers, pin_memory=False)

    return train_loader, val_loader
