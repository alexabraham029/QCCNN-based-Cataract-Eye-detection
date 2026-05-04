# ⚛ QCNN Cataract Detection

A **Hybrid Quantum-Classical Convolutional Neural Network** for automated cataract detection from eye images. Built with PennyLane, PyTorch, FastAPI, and React.

---

## Architecture

```
Eye Image → ResNet-18 backbone → Linear (512→4) → 4-Qubit VQC → Linear (4→1) → Cataract / Normal
```

The quantum layer uses:
- **AngleEmbedding** — encodes 4 features as Ry rotation angles
- **StronglyEntanglingLayers** — 2 variational layers with CNOT entanglement
- **PauliZ measurement** — outputs 4 expectation values for classification

---

## Quick Start

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Download dataset (add your Kaggle credentials to .env first)
cp .env.example .env        # fill in KAGGLE_USERNAME and KAGGLE_KEY
python download_dataset.py

# Train the QCNN (~2-4 hrs on CPU, faster with GPU)
python -m model.train --data_dir dataset/train --epochs 30

# Start the API server
uvicorn main:app --reload --port 8000
```

> **Demo mode**: The server runs immediately even without training. Upload any eye image and see a simulated quantum prediction.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

---

## Kaggle Credentials (New API method)

1. Go to [kaggle.com/settings](https://www.kaggle.com/settings) → API → **Create New Token**
2. Note the `username` and `key` from the downloaded `kaggle.json`
3. Create `backend/.env`:

```
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_api_key
```

---

## Dataset

**Eye Diseases Classification** — [Kaggle](https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification)

| Split | Cataract | Normal | Total Used |
|-------|----------|--------|------------|
| Train | ~878     | ~859   | ~1,737     |
| Val   | ~220     | ~215   | ~435       |

---

## Project Structure

```
QCNN/
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── download_dataset.py        # Kaggle downloader
│   ├── .env                       # Kaggle credentials (git-ignored)
│   ├── model/
│   │   ├── qcnn_model.py          # Hybrid QCNN architecture
│   │   ├── train.py               # Training script
│   │   ├── predict.py             # Inference helper
│   │   └── saved_model/           # Trained weights + metrics.json
│   └── utils/
│       ├── dataset.py             # Dataset loader (binary filter)
│       └── preprocess.py          # CLAHE enhancement + transforms
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx           # Landing page
        │   ├── Detect.jsx         # Upload + diagnosis
        │   └── About.jsx          # Architecture explainer
        └── components/
            ├── CircuitVisualizer  # SVG quantum circuit diagram
            ├── MetricsPanel       # Accuracy/loss charts + confusion matrix
            ├── ResultCard         # Prediction + confidence arc
            └── UploadPanel        # Drag-and-drop upload
```

---

## API Endpoints

| Method | Endpoint   | Description                          |
|--------|-----------|--------------------------------------|
| POST   | /predict  | Upload eye image → diagnosis JSON    |
| GET    | /metrics  | Model accuracy, F1, AUC, history     |
| GET    | /health   | Server status + model load state     |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Quantum layer | PennyLane (default.qubit simulator) |
| Classical backbone | PyTorch + ResNet-18 (ImageNet pretrained) |
| API | FastAPI + Uvicorn |
| Frontend | React 18 + Vite |
| Image enhancement | OpenCV CLAHE |
| Dataset | Kaggle API v2 |
