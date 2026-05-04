"""
Hybrid Quantum-Classical CNN for Cataract Detection
Architecture:
  1. Classical backbone (ResNet18) → 512-dim features
  2. Linear compression        → N_QUBITS-dim vector
  3. Quantum variational layer  → N_QUBITS expectation values
  4. Classical head            → binary output (sigmoid)
"""

import math
import torch
import torch.nn as nn
import torchvision.models as models
import pennylane as qml

# ── Quantum config ──────────────────────────────────────────────────────────
N_QUBITS = 4
N_LAYERS = 2

dev = qml.device("default.qubit", wires=N_QUBITS)


@qml.qnode(dev, interface="torch")
def quantum_circuit(inputs, weights):
    """
    Parameterized quantum circuit:
      - AngleEmbedding encodes classical features as qubit rotation angles
      - StronglyEntanglingLayers applies learnable entangling gates
      - Measure PauliZ expectation on each qubit
    """
    qml.AngleEmbedding(inputs, wires=range(N_QUBITS), rotation="Y")
    qml.StronglyEntanglingLayers(weights, wires=range(N_QUBITS))
    return [qml.expval(qml.PauliZ(i)) for i in range(N_QUBITS)]


weight_shapes = {"weights": (N_LAYERS, N_QUBITS, 3)}


# ── Hybrid Model ─────────────────────────────────────────────────────────────
class HybridQCNN(nn.Module):
    """
    Hybrid Quantum-Classical Convolutional Neural Network.
    Classical layers extract image features; quantum layers classify.
    """

    def __init__(self, freeze_backbone: bool = True):
        super().__init__()

        # 1. Classical backbone — ResNet18 without the final FC layer
        resnet = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])  # output: [B, 512, 1, 1]

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        # 2. Compress 512 → N_QUBITS (scale to [0, π] via Tanh + shift)
        self.compress = nn.Sequential(
            nn.Linear(512, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, N_QUBITS),
            nn.Tanh(),  # output in [-1, 1]
        )

        # 3. Quantum variational layer
        self.quantum_layer = qml.qnn.TorchLayer(quantum_circuit, weight_shapes)

        # 4. Classical output head
        self.head = nn.Sequential(
            nn.Linear(N_QUBITS, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Classical feature extraction
        feats = self.backbone(x)                    # [B, 512, 1, 1]
        feats = feats.view(feats.size(0), -1)       # [B, 512]

        # Compress + scale to [0, π] for AngleEmbedding
        compressed = self.compress(feats)           # [B, N_QUBITS] ∈ [-1, 1]
        q_input = (compressed + 1.0) * (math.pi / 2.0)  # → [0, π]

        # Quantum processing
        q_out = self.quantum_layer(q_input)         # [B, N_QUBITS]

        # Binary classification
        return self.head(q_out)                     # [B, 1]

    def unfreeze_backbone(self):
        """Call after initial training to fine-tune the CNN backbone."""
        for param in self.backbone.parameters():
            param.requires_grad = True


def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    model = HybridQCNN()
    dummy = torch.randn(2, 3, 224, 224)
    out = model(dummy)
    print(f"Output shape : {out.shape}")          # [2, 1]
    print(f"Trainable params: {count_parameters(model):,}")
    print(qml.draw(quantum_circuit)(dummy[:1].mean(dim=[1, 2, 3])[:N_QUBITS],
                                    torch.zeros(weight_shapes["weights"])))
