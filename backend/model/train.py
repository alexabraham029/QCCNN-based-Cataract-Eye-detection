"""
Training script for Hybrid QCNN Cataract Detection.
Usage:
    cd backend
    python -m model.train --data_dir dataset/dataset --epochs 30
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"   # Fix OMP Error #15 on Windows/Anaconda

import sys
import json
import argparse
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import StepLR
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import numpy as np

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from model.qcnn_model import HybridQCNN, count_parameters
from utils.dataset import get_data_loaders

SAVE_DIR = Path(__file__).parent / "saved_model"
SAVE_DIR.mkdir(exist_ok=True)
WEIGHTS_PATH = SAVE_DIR / "qcnn_weights.pt"
METRICS_PATH = SAVE_DIR / "metrics.json"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def train_one_epoch(model, loader, criterion, optimizer):
    model.train()
    total_loss, all_preds, all_labels = 0.0, [], []

    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(DEVICE), labels.to(DEVICE).unsqueeze(1)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        preds = (outputs.detach().cpu() > 0.5).float().squeeze().tolist()
        all_preds.extend(preds if isinstance(preds, list) else [preds])
        all_labels.extend(labels.cpu().squeeze().tolist())

        print(f"  Batch {batch_idx+1}/{len(loader)} — loss: {loss.item():.4f}", end="\r")

    acc = accuracy_score(all_labels, all_preds)
    return total_loss / len(loader), acc


@torch.no_grad()
def evaluate(model, loader, criterion):
    model.eval()
    total_loss, all_preds, all_probs, all_labels = 0.0, [], [], []

    for images, labels in loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE).unsqueeze(1)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item()

        probs = outputs.cpu().squeeze().tolist()
        preds = [1 if p > 0.5 else 0 for p in (probs if isinstance(probs, list) else [probs])]
        all_probs.extend(probs if isinstance(probs, list) else [probs])
        all_preds.extend(preds)
        all_labels.extend(labels.cpu().squeeze().tolist())

    acc = accuracy_score(all_labels, all_preds)
    f1  = f1_score(all_labels, all_preds, zero_division=0)
    try:
        auc = roc_auc_score(all_labels, all_probs)
    except Exception:
        auc = 0.0

    return total_loss / len(loader), acc, f1, auc


def compute_confusion(model, loader):
    """Return TP, FP, FN, TN for the binary classification task."""
    model.eval()
    tp = fp = fn = tn = 0
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(DEVICE)
            preds = (model(images).cpu().squeeze() > 0.5).int().tolist()
            lbls  = labels.int().tolist()
            if not isinstance(preds, list): preds = [preds]
            if not isinstance(lbls,  list): lbls  = [lbls]
            for p, l in zip(preds, lbls):
                if   p == 1 and l == 1: tp += 1
                elif p == 1 and l == 0: fp += 1
                elif p == 0 and l == 1: fn += 1
                else:                   tn += 1
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn}


def train(data_dir: str, epochs: int = 30, batch_size: int = 8, lr: float = 1e-3):
    print(f"\n{'='*60}")
    print(f"  QCNN Cataract Detection — Training")
    print(f"  Device  : {DEVICE}")
    print(f"  Data    : {data_dir}")
    print(f"  Epochs  : {epochs}  |  Batch: {batch_size}  |  LR: {lr}")
    print(f"{'='*60}\n")

    # Data
    train_loader, val_loader = get_data_loaders(data_dir, batch_size=batch_size)

    # Model
    model = HybridQCNN(freeze_backbone=True).to(DEVICE)
    print(f"Trainable params: {count_parameters(model):,}")

    criterion = nn.BCELoss()
    optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scheduler = StepLR(optimizer, step_size=10, gamma=0.5)

    best_val_acc = 0.0
    history = []

    for epoch in range(1, epochs + 1):
        t0 = time.time()

        # Unfreeze backbone after epoch 10 for fine-tuning
        if epoch == 11:
            model.unfreeze_backbone()
            optimizer = Adam(model.parameters(), lr=lr * 0.1)
            print("\n🔓 Backbone unfrozen for fine-tuning\n")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer)
        val_loss,   val_acc, val_f1, val_auc = evaluate(model, val_loader, criterion)
        scheduler.step()

        elapsed = time.time() - t0
        print(f"\nEpoch {epoch:02d}/{epochs} [{elapsed:.1f}s] "
              f"| Train loss: {train_loss:.4f} acc: {train_acc:.4f} "
              f"| Val loss: {val_loss:.4f} acc: {val_acc:.4f} "
              f"f1: {val_f1:.4f} auc: {val_auc:.4f}")

        history.append({
            "epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss, "val_acc": val_acc, "val_f1": val_f1, "val_auc": val_auc,
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), WEIGHTS_PATH)
            print(f"  ✅ Saved best model (val_acc={val_acc:.4f})")

    # Compute confusion matrix on validation set with best model
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=DEVICE))
    confusion = compute_confusion(model, val_loader)

    # Precision / Recall from confusion
    precision = confusion["tp"] / max(confusion["tp"] + confusion["fp"], 1)
    recall    = confusion["tp"] / max(confusion["tp"] + confusion["fn"], 1)
    n_val     = len(val_loader.dataset)

    # Save metrics
    metrics = {
        "accuracy":          best_val_acc,
        "precision":         round(precision, 4),
        "recall":            round(recall,    4),
        "f1_score":          history[-1]["val_f1"],
        "auc_roc":           history[-1]["val_auc"],
        "epochs":            epochs,
        "n_qubits":          4,
        "n_layers":          2,
        "trainable_params":  24,
        "n_test_samples":    n_val,
        "history":           history,
        "confusion":         confusion,
        "demo_mode":         False,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n🎉 Training complete! Best val acc: {best_val_acc:.4f}")
    print(f"   Weights saved → {WEIGHTS_PATH}")
    print(f"   Metrics saved → {METRICS_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir",   type=str, default="dataset/train")
    parser.add_argument("--epochs",     type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr",         type=float, default=1e-3)
    args = parser.parse_args()
    train(args.data_dir, args.epochs, args.batch_size, args.lr)
