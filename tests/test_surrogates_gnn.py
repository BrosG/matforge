"""Tests for GNN-based surrogates: CHGNet and MACE."""

import numpy as np
import pytest


class TestChgnetSurrogate:
    """Test CHGNet surrogate — should fall back to NumpyMLP when chgnet is not installed."""

    def test_import(self):
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate, ChgnetConfig
        assert ChgnetSurrogate is not None
        assert ChgnetConfig is not None

    def test_default_config(self):
        from materia.surrogate.chgnet_surrogate import ChgnetConfig
        cfg = ChgnetConfig()
        assert cfg.model_name == "0.3.0"
        assert cfg.use_gpu is False

    def test_fallback_to_mlp(self):
        """When chgnet is not installed, should fall back to NumpyMLP."""
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate
        surrogate = ChgnetSurrogate(input_dim=4, output_dim=2)

        rng = np.random.default_rng(42)
        X = rng.random((20, 4))
        Y = rng.random((20, 2))

        metrics = surrogate.train(X, Y)
        assert isinstance(metrics, dict)
        assert "final_train_loss" in metrics

        Y_mean, Y_std = surrogate.predict(X)
        assert Y_mean.shape == (20, 2)
        assert Y_std.shape == (20, 2)
        assert np.all(Y_std >= 0)

    def test_accuracy_returns_dict(self):
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate
        surrogate = ChgnetSurrogate(input_dim=3, output_dim=1)

        rng = np.random.default_rng(42)
        X = rng.random((10, 3))
        Y = rng.random((10, 1))
        surrogate.train(X, Y)

        acc = surrogate.accuracy()
        assert isinstance(acc, dict)

    def test_predict_single_sample(self):
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate
        surrogate = ChgnetSurrogate(input_dim=3, output_dim=1)

        rng = np.random.default_rng(42)
        X = rng.random((10, 3))
        Y = rng.random((10, 1))
        surrogate.train(X, Y)

        x_single = rng.random(3)
        Y_mean, Y_std = surrogate.predict(x_single)
        assert Y_mean.shape == (1, 1)
        assert Y_std.shape == (1, 1)

    def test_conforms_to_surrogate_abc(self):
        from materia.surrogate.base import SurrogateModel
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate
        assert issubclass(ChgnetSurrogate, SurrogateModel)


class TestMaceSurrogate:
    """Test MACE surrogate — should fall back to NumpyMLP when mace-torch is not installed."""

    def test_import(self):
        from materia.surrogate.mace_surrogate import MaceSurrogate, MaceConfig
        assert MaceSurrogate is not None
        assert MaceConfig is not None

    def test_default_config(self):
        from materia.surrogate.mace_surrogate import MaceConfig
        cfg = MaceConfig()
        assert cfg.model_name == "medium"
        assert cfg.device == "cpu"

    def test_fallback_to_mlp(self):
        """When mace-torch is not installed, should fall back to NumpyMLP."""
        from materia.surrogate.mace_surrogate import MaceSurrogate
        surrogate = MaceSurrogate(input_dim=5, output_dim=2)

        rng = np.random.default_rng(42)
        X = rng.random((20, 5))
        Y = rng.random((20, 2))

        metrics = surrogate.train(X, Y)
        assert isinstance(metrics, dict)
        assert "final_train_loss" in metrics

        Y_mean, Y_std = surrogate.predict(X)
        assert Y_mean.shape == (20, 2)
        assert Y_std.shape == (20, 2)
        assert np.all(Y_std >= 0)

    def test_accuracy_returns_dict(self):
        from materia.surrogate.mace_surrogate import MaceSurrogate
        surrogate = MaceSurrogate(input_dim=3, output_dim=1)

        rng = np.random.default_rng(42)
        X = rng.random((10, 3))
        Y = rng.random((10, 1))
        surrogate.train(X, Y)

        acc = surrogate.accuracy()
        assert isinstance(acc, dict)

    def test_predict_single_sample(self):
        from materia.surrogate.mace_surrogate import MaceSurrogate
        surrogate = MaceSurrogate(input_dim=4, output_dim=1)

        rng = np.random.default_rng(42)
        X = rng.random((10, 4))
        Y = rng.random((10, 1))
        surrogate.train(X, Y)

        x_single = rng.random(4)
        Y_mean, Y_std = surrogate.predict(x_single)
        assert Y_mean.shape == (1, 1)
        assert Y_std.shape == (1, 1)

    def test_conforms_to_surrogate_abc(self):
        from materia.surrogate.base import SurrogateModel
        from materia.surrogate.mace_surrogate import MaceSurrogate
        assert issubclass(MaceSurrogate, SurrogateModel)


class TestCampaignSurrogateSelection:
    """Test that campaign.py correctly routes to CHGNet/MACE surrogates."""

    def test_chgnet_architecture_selection(self):
        """Campaign with architecture='chgnet' should create ChgnetSurrogate (fallback to MLP)."""
        from materia.campaign import Campaign
        from materia.mdl import parse_material_def

        # Use existing test fixture
        fixture_path = "tests/fixtures/water_material.yaml"
        try:
            definition = parse_material_def(fixture_path)
        except FileNotFoundError:
            pytest.skip("Test fixture not available")

        definition.surrogate_config = {"architecture": "chgnet"}
        campaign = Campaign(definition=definition)

        # Should be either ChgnetSurrogate or NumpyMLP (fallback)
        from materia.surrogate.chgnet_surrogate import ChgnetSurrogate
        from materia.surrogate.mlp import NumpyMLP
        assert isinstance(campaign.surrogate, (ChgnetSurrogate, NumpyMLP))

    def test_mace_architecture_selection(self):
        """Campaign with architecture='mace' should create MaceSurrogate (fallback to MLP)."""
        from materia.campaign import Campaign
        from materia.mdl import parse_material_def

        fixture_path = "tests/fixtures/water_material.yaml"
        try:
            definition = parse_material_def(fixture_path)
        except FileNotFoundError:
            pytest.skip("Test fixture not available")

        definition.surrogate_config = {"architecture": "mace"}
        campaign = Campaign(definition=definition)

        from materia.surrogate.mace_surrogate import MaceSurrogate
        from materia.surrogate.mlp import NumpyMLP
        assert isinstance(campaign.surrogate, (MaceSurrogate, NumpyMLP))
