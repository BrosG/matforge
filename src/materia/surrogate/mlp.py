"""Multi-layer perceptron surrogate model implemented entirely in NumPy.

Features:
- Xavier/Glorot initialization
- ReLU hidden activations, linear output
- Adam optimizer
- Input/output z-score normalization
- MC Dropout for uncertainty estimation
- Mini-batch training with early stopping
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from materia.surrogate.base import SurrogateModel


@dataclass
class MLPConfig:
    """Configuration for the MLP surrogate."""

    hidden_layers: list[int] = field(default_factory=lambda: [128, 128])
    learning_rate: float = 1e-3
    batch_size: int = 64
    epochs: int = 200
    dropout_rate: float = 0.1
    weight_decay: float = 1e-4
    early_stopping_patience: int = 20
    validation_fraction: float = 0.1
    mc_samples: int = 30
    seed: int | None = None


class NumpyMLP(SurrogateModel):
    """MLP surrogate with MC Dropout uncertainty, built from scratch in NumPy."""

    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        config: MLPConfig | None = None,
    ) -> None:
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.config = config or MLPConfig()
        self._rng = np.random.default_rng(self.config.seed)

        # Build layers: [input, hidden1, hidden2, ..., output]
        dims = [input_dim] + self.config.hidden_layers + [output_dim]

        # Xavier initialization
        self.weights: list[np.ndarray] = []
        self.biases: list[np.ndarray] = []
        for i in range(len(dims) - 1):
            scale = np.sqrt(2.0 / (dims[i] + dims[i + 1]))
            self.weights.append(self._rng.normal(0, scale, (dims[i], dims[i + 1])))
            self.biases.append(np.zeros(dims[i + 1]))

        # Adam state
        self._m_w = [np.zeros_like(w) for w in self.weights]
        self._v_w = [np.zeros_like(w) for w in self.weights]
        self._m_b = [np.zeros_like(b) for b in self.biases]
        self._v_b = [np.zeros_like(b) for b in self.biases]
        self._t = 0

        # Normalization stats
        self._x_mean: np.ndarray | None = None
        self._x_std: np.ndarray | None = None
        self._y_mean: np.ndarray | None = None
        self._y_std: np.ndarray | None = None
        self._training_history: dict[str, list[float]] = {}

    def _forward(
        self, X: np.ndarray, dropout: bool = False
    ) -> tuple[np.ndarray, list[np.ndarray]]:
        """Forward pass. Returns (output, activations list)."""
        activations = [X]
        h = X
        for i in range(len(self.weights) - 1):
            z = h @ self.weights[i] + self.biases[i]
            h = np.maximum(0, z)  # ReLU
            if dropout and self.config.dropout_rate > 0:
                mask = self._rng.binomial(
                    1, 1 - self.config.dropout_rate, h.shape
                ).astype(h.dtype)
                h = h * mask / (1 - self.config.dropout_rate)
            activations.append(h)

        out = h @ self.weights[-1] + self.biases[-1]
        activations.append(out)
        return out, activations

    def _backward(
        self, activations: list[np.ndarray], y_true: np.ndarray
    ) -> tuple[list[np.ndarray], list[np.ndarray]]:
        """Backward pass via backpropagation. Returns (dW_list, db_list)."""
        m = y_true.shape[0]
        delta = (activations[-1] - y_true) / m

        dW_list: list[np.ndarray] = []
        db_list: list[np.ndarray] = []

        for i in range(len(self.weights) - 1, -1, -1):
            dW = activations[i].T @ delta + self.config.weight_decay * self.weights[i]
            db = delta.sum(axis=0)
            dW_list.insert(0, dW)
            db_list.insert(0, db)

            if i > 0:
                delta = (delta @ self.weights[i].T) * (activations[i] > 0).astype(float)

        return dW_list, db_list

    def _adam_step(self, dW_list: list[np.ndarray], db_list: list[np.ndarray]) -> None:
        """Apply Adam optimizer update."""
        self._t += 1
        lr = self.config.learning_rate
        beta1, beta2, eps = 0.9, 0.999, 1e-8

        for i in range(len(self.weights)):
            self._m_w[i] = beta1 * self._m_w[i] + (1 - beta1) * dW_list[i]
            self._v_w[i] = beta2 * self._v_w[i] + (1 - beta2) * (dW_list[i] ** 2)
            m_hat = self._m_w[i] / (1 - beta1**self._t)
            v_hat = self._v_w[i] / (1 - beta2**self._t)
            self.weights[i] -= lr * m_hat / (np.sqrt(v_hat) + eps)

            self._m_b[i] = beta1 * self._m_b[i] + (1 - beta1) * db_list[i]
            self._v_b[i] = beta2 * self._v_b[i] + (1 - beta2) * (db_list[i] ** 2)
            m_hat = self._m_b[i] / (1 - beta1**self._t)
            v_hat = self._v_b[i] / (1 - beta2**self._t)
            self.biases[i] -= lr * m_hat / (np.sqrt(v_hat) + eps)

    def train(self, X: np.ndarray, Y: np.ndarray) -> dict:
        """Train the MLP on (X, Y) data with early stopping."""
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        if Y.ndim == 1:
            Y = Y.reshape(-1, 1)

        # Filter out rows with NaN or inf
        valid_mask = np.all(np.isfinite(X), axis=1) & np.all(np.isfinite(Y), axis=1)
        X = X[valid_mask]
        Y = Y[valid_mask]

        if X.shape[0] < 2:
            return {
                "final_train_loss": float("inf"),
                "final_val_loss": float("inf"),
                "epochs_trained": 0,
            }

        # Normalize (use max(std, 1e-8) to handle constant columns)
        self._x_mean = X.mean(axis=0)
        self._x_std = np.maximum(X.std(axis=0), 1e-8)
        self._y_mean = Y.mean(axis=0)
        self._y_std = np.maximum(Y.std(axis=0), 1e-8)

        X_norm = (X - self._x_mean) / self._x_std
        Y_norm = (Y - self._y_mean) / self._y_std

        # Train/val split
        n = X_norm.shape[0]
        n_val = max(1, int(n * self.config.validation_fraction))
        indices = self._rng.permutation(n)
        val_idx, train_idx = indices[:n_val], indices[n_val:]

        X_train, Y_train = X_norm[train_idx], Y_norm[train_idx]
        X_val, Y_val = X_norm[val_idx], Y_norm[val_idx]

        best_val_loss = float("inf")
        patience_counter = 0
        history: dict[str, list[float]] = {"train_loss": [], "val_loss": []}

        # Store best weights
        best_weights = [w.copy() for w in self.weights]
        best_biases = [b.copy() for b in self.biases]

        for epoch in range(self.config.epochs):
            # Shuffle
            perm = self._rng.permutation(X_train.shape[0])
            X_train = X_train[perm]
            Y_train = Y_train[perm]

            # Mini-batch training
            epoch_loss = 0.0
            n_batches = 0
            for start in range(0, X_train.shape[0], self.config.batch_size):
                end = min(start + self.config.batch_size, X_train.shape[0])
                X_batch = X_train[start:end]
                Y_batch = Y_train[start:end]

                out, activations = self._forward(X_batch, dropout=False)
                dW, db = self._backward(activations, Y_batch)
                self._adam_step(dW, db)

                epoch_loss += float(np.mean((out - Y_batch) ** 2))
                n_batches += 1

            train_loss = epoch_loss / max(n_batches, 1)
            val_out, _ = self._forward(X_val, dropout=False)
            val_loss = float(np.mean((val_out - Y_val) ** 2))

            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)

            if val_loss < best_val_loss - 1e-6:
                best_val_loss = val_loss
                patience_counter = 0
                best_weights = [w.copy() for w in self.weights]
                best_biases = [b.copy() for b in self.biases]
            else:
                patience_counter += 1
                if patience_counter >= self.config.early_stopping_patience:
                    break

        # Restore best weights
        self.weights = best_weights
        self.biases = best_biases
        self._training_history = history
        return {
            "final_train_loss": history["train_loss"][-1],
            "final_val_loss": best_val_loss,
            "epochs_trained": len(history["train_loss"]),
        }

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Predict with uncertainty via MC Dropout.

        Returns: (Y_mean, Y_std) each of shape (N, output_dim).
        """
        if X.ndim == 1:
            X = X.reshape(1, -1)
        if self._x_mean is None:
            raise RuntimeError("Model must be trained before prediction")

        X_norm = (X - self._x_mean) / self._x_std

        predictions = []
        for _ in range(self.config.mc_samples):
            out, _ = self._forward(X_norm, dropout=True)
            out_denorm = out * self._y_std + self._y_mean
            predictions.append(out_denorm)

        preds = np.stack(predictions, axis=0)
        Y_mean = preds.mean(axis=0)
        Y_std = preds.std(axis=0)
        return Y_mean, Y_std

    def accuracy(self) -> dict:
        """Return accuracy metrics from training history."""
        if not self._training_history:
            return {"trained": False}
        return {
            "trained": True,
            "final_train_loss": self._training_history["train_loss"][-1],
            "final_val_loss": self._training_history["val_loss"][-1],
            "epochs_trained": len(self._training_history["train_loss"]),
        }
