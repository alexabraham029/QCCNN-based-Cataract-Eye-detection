"""
Kaggle dataset download + extraction script.
Uses environment variables (KAGGLE_USERNAME, KAGGLE_KEY) via a .env file.

Setup:
    1. Create backend/.env:
           KAGGLE_USERNAME=your_username
           KAGGLE_KEY=your_api_key
    2. Run:  python download_dataset.py

Dataset: Eye Diseases Classification
URL    : https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification
"""

import os
import sys
import zipfile
from pathlib import Path
from dotenv import load_dotenv

# Load credentials from .env before importing kaggle
load_dotenv(Path(__file__).parent / ".env")

DATASET_SLUG = "gunavenkatdoddi/eye-diseases-classification"
DEST_DIR     = Path(__file__).parent / "dataset"


def check_kaggle_auth():
    username = os.environ.get("KAGGLE_USERNAME")
    key      = os.environ.get("KAGGLE_KEY")

    if not username or not key:
        print("ERROR: Kaggle credentials not found in .env file.")
        print()
        print("   1. Go to https://www.kaggle.com/settings -> API -> Create New Token")
        print("   2. Add to backend/.env:")
        print("          KAGGLE_USERNAME=your_username")
        print("          KAGGLE_KEY=your_api_key")
        sys.exit(1)

    os.environ["KAGGLE_USERNAME"] = username
    os.environ["KAGGLE_KEY"]      = key
    print(f"[OK] Kaggle credentials loaded for user: {username}")


def download_and_extract():
    check_kaggle_auth()

    import kaggle

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    if (DEST_DIR / "train").exists():
        print("[OK] Dataset already extracted at:", DEST_DIR)
        _print_stats()
        return

    print(f"\n[INFO] Downloading '{DATASET_SLUG}' from Kaggle...")
    kaggle.api.authenticate()
    kaggle.api.dataset_download_files(DATASET_SLUG, path=str(DEST_DIR), unzip=False)

    zips = list(DEST_DIR.glob("*.zip"))
    if not zips:
        print("[ERROR] Download failed - no zip file found in", DEST_DIR)
        sys.exit(1)

    print("[INFO] Extracting...")
    for zp in zips:
        with zipfile.ZipFile(zp, "r") as zf:
            zf.extractall(DEST_DIR)
        zp.unlink()
        print(f"       Extracted: {zp.name}")

    print(f"\n[OK] Dataset ready at: {DEST_DIR}")
    _print_stats()


def _print_stats():
    """Print class distribution."""
    for split in ["train", "test"]:
        split_dir = DEST_DIR / split
        if not split_dir.exists():
            continue
        print(f"\n  [{split.upper()}]")
        for cls_dir in sorted(split_dir.iterdir()):
            if not cls_dir.is_dir():
                continue
            n = sum(1 for f in cls_dir.rglob("*")
                    if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp"})
            star = "(*)" if any(k in cls_dir.name.lower() for k in ["cataract", "normal"]) else "   "
            print(f"    {star} {cls_dir.name:<35} {n:>5} images")
    print()
    print("  (*) = classes used for QCNN binary training (Cataract + Normal)")


if __name__ == "__main__":
    download_and_extract()
