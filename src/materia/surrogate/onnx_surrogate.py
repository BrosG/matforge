"""ONNX Runtime surrogate for pre-trained GNN models (MACE, M3GNet)."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from materia.surrogate.base import SurrogateModel

logger = logging.getLogger(__name__)


@dataclass
class OnnxConfig:
    """Configuration for the ONNX surrogate."""

    model_path: str = ""
    mc_samples: int = 10
    input_names: list[str] = field(default_factory=lambda: ["input"])
    output_names: list[str] = field(default_factory=lambda: ["output"])
    use_gpu: bool = False


class OnnxSurrogate(SurrogateModel):
    """Loads a pre-trained GNN model exported as ONNX.

    Supports MACE and M3GNet models exported via torch.onnx.export().
    Falls back to NumpyMLP if onnxruntime is not installed.
    Uses input noise injection for uncertainty estimation since ONNX
    models lack native dropout.
    """

    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        config: OnnxConfig | None = None,
    ) -> None:
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.config = config or OnnxConfig()
        self._session = None
        self._rng = np.random.default_rng()
        self._residual_std: np.ndarray | None = None
        self._trained = False
        self._fallback = None

        try:
            import onnxruntime

            self._ort = onnxruntime
        except ImportError:
            self._ort = None
            logger.warning(
                "onnxruntime not installed. OnnxSurrogate will fall back to NumpyMLP. "
                "Install with: pip install onnxruntime"
            )

    def _load_model(self) -> None:
        """Load ONNX model from disk."""
        if self._ort is None:
            return
        model_path = Path(self.config.model_path)
        if not model_path.exists():
            logger.warning(f"ONNX model not found: {model_path}, falling back to MLP")
            return
        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if self.config.use_gpu
            else ["CPUExecutionProvider"]
        )
        self._session = self._ort.InferenceSession(str(model_path), providers=providers)

    def train(self, X: np.ndarray, Y: np.ndarray) -> dict:
        """For pre-trained ONNX models, 'training' means loading the model
        and computing calibration statistics from provided data."""
        if self._session is None and self._fallback is None:
            self._load_model()

        if self._session is None:
            from materia.surrogate.mlp import MLPConfig, NumpyMLP

            self._fallback = NumpyMLP(self.input_dim, self.output_dim, MLPConfig())
            return self._fallback.train(X, Y)

        # Compute residual uncertainty from training data
        Y_pred = self._run_inference(X)
        self._residual_std = np.maximum(np.std(Y - Y_pred, axis=0), 1e-8)
        self._trained = True

        mse = float(np.mean((Y - Y_pred) ** 2))
        return {
            "final_train_loss": mse,
            "final_val_loss": mse,
            "epochs_trained": 0,
            "model": "onnx",
        }

    def _run_inference(self, X: np.ndarray) -> np.ndarray:
        """Run a single inference pass through the ONNX model."""
        feed = {self.config.input_names[0]: X.astype(np.float32)}
        outputs = self._session.run(self.config.output_names, feed)
        return outputs[0]

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Predict with uncertainty via input noise injection."""
        if self._fallback is not None:
            return self._fallback.predict(X)

        if X.ndim == 1:
            X = X.reshape(1, -1)

        predictions = []
        for _ in range(self.config.mc_samples):
            noise = self._rng.normal(0, 0.01, X.shape)
            X_noisy = X + noise
            pred = self._run_inference(X_noisy)
            predictions.append(pred)

        preds = np.stack(predictions, axis=0)
        Y_mean = preds.mean(axis=0)
        residual_var = self._residual_std**2 if self._residual_std is not None else 0
        Y_std = np.sqrt(preds.var(axis=0) + residual_var)
        return Y_mean, Y_std

    def accuracy(self) -> dict:
        if self._fallback is not None:
            return self._fallback.accuracy()
        return {
            "trained": self._trained,
            "model": "onnx",
            "model_path": self.config.model_path,
        }
