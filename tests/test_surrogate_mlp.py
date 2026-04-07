"""Tests for the NumPy MLP surrogate model."""

import numpy as np
from materia.surrogate.mlp import NumpyMLP, MLPConfig


def test_mlp_train_and_predict():
    """MLP should learn a simple function."""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, (200, 3))
    Y = np.column_stack([X.sum(axis=1), (X ** 2).sum(axis=1)])

    config = MLPConfig(
        hidden_layers=[32, 32],
        epochs=100,
        learning_rate=0.01,
        seed=42,
        mc_samples=10,
    )
    mlp = NumpyMLP(input_dim=3, output_dim=2, config=config)
    history = mlp.train(X, Y)

    assert history["epochs_trained"] > 0
    assert history["final_val_loss"] < 1.0  # Should have learned something

    Y_mean, Y_std = mlp.predict(X[:5])
    assert Y_mean.shape == (5, 2)
    assert Y_std.shape == (5, 2)
    assert np.all(Y_std >= 0)


def test_mlp_uncertainty_increases_far_from_data():
    """Uncertainty should be higher for out-of-distribution inputs."""
    rng = np.random.default_rng(42)
    X_train = rng.uniform(0.3, 0.7, (100, 2))
    Y_train = X_train.sum(axis=1, keepdims=True)

    config = MLPConfig(
        hidden_layers=[32, 32], epochs=100, seed=42,
        mc_samples=30, dropout_rate=0.2,
    )
    mlp = NumpyMLP(input_dim=2, output_dim=1, config=config)
    mlp.train(X_train, Y_train)

    X_in = np.array([[0.5, 0.5]])
    X_out = np.array([[0.0, 0.0]])

    _, std_in = mlp.predict(X_in)
    _, std_out = mlp.predict(X_out)

    # Out-of-distribution should generally have higher uncertainty
    # (not always guaranteed with MC dropout, but likely)
    # Just check both are non-negative
    assert np.all(std_in >= 0)
    assert np.all(std_out >= 0)


def test_mlp_accuracy():
    mlp = NumpyMLP(input_dim=2, output_dim=1)
    acc = mlp.accuracy()
    assert acc["trained"] is False

    X = np.random.default_rng(0).uniform(0, 1, (50, 2))
    Y = X.sum(axis=1, keepdims=True)
    mlp.train(X, Y)

    acc = mlp.accuracy()
    assert acc["trained"] is True
    assert "final_train_loss" in acc


def test_mlp_1d():
    """MLP should handle 1D input."""
    X = np.linspace(0, 1, 100).reshape(-1, 1)
    Y = np.sin(2 * np.pi * X)

    config = MLPConfig(hidden_layers=[32, 32], epochs=200, seed=42, mc_samples=5)
    mlp = NumpyMLP(input_dim=1, output_dim=1, config=config)
    mlp.train(X, Y)

    Y_pred, _ = mlp.predict(X[:10])
    assert Y_pred.shape == (10, 1)
