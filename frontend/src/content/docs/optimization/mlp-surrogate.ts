import { DocPage } from "../index";

const page: DocPage = {
  slug: "mlp-surrogate",
  title: "MLP Surrogate Model",
  description: "Multi-layer perceptron surrogate for fast objective prediction.",
  category: "optimization",
  order: 1,
  lastUpdated: "2026-04-01",
  tags: ["surrogate", "mlp", "neural-network", "machine-learning"],
  readingTime: 7,
  body: `
## MLP Surrogate Model

The Multi-Layer Perceptron (MLP) is the default surrogate model in MatCraft. It provides a fast, differentiable approximation of the true evaluation function, enabling the optimizer to screen thousands of candidates without expensive physics simulations.

### Architecture

MatCraft's MLP surrogate uses a standard feedforward architecture:

\`\`\`
Input (d parameters) -> FC(128) -> ReLU -> Dropout(0.1)
                     -> FC(64)  -> ReLU -> Dropout(0.1)
                     -> Output (k objectives)
\`\`\`

Where \`d\` is the number of parameters and \`k\` is the number of objectives. Each objective head shares the same hidden layers but has an independent output neuron.

### How It Fits in the Loop

The surrogate model is retrained from scratch at each active learning iteration:

1. All evaluated (parameters, objectives) pairs are collected as the training set.
2. The MLP is trained for a fixed number of epochs with early stopping.
3. CMA-ES uses the trained MLP to score candidates via the acquisition function.
4. The top-scoring candidates are selected for real evaluation.
5. New evaluation results are added to the training set, and the cycle repeats.

### Configuration

Configure the surrogate in the MDL file or \`materia.toml\`:

\`\`\`yaml
optimizer:
  surrogate: mlp
  surrogate_config:
    hidden_layers: [128, 64]
    learning_rate: 0.001
    epochs: 200
    dropout: 0.1
    activation: relu
    batch_size: 32
    early_stopping_patience: 20
\`\`\`

| Parameter | Default | Description |
|-----------|---------|-------------|
| \`hidden_layers\` | [128, 64] | List of hidden layer sizes |
| \`learning_rate\` | 0.001 | Adam optimizer learning rate |
| \`epochs\` | 200 | Maximum training epochs |
| \`dropout\` | 0.1 | Dropout probability |
| \`activation\` | relu | Activation function (relu, tanh, silu) |
| \`batch_size\` | 32 | Training mini-batch size |
| \`early_stopping_patience\` | 20 | Epochs without improvement before stopping |

### Input Preprocessing

Before feeding parameter vectors to the MLP, MatCraft applies automatic preprocessing:

- **Continuous parameters**: Min-max normalized to [0, 1] based on bounds.
- **Integer parameters**: Normalized the same as continuous.
- **Categorical parameters**: One-hot encoded. Each category becomes a binary input dimension.
- **Log-scale parameters**: Log-transformed before normalization.

### Uncertainty Estimation

For acquisition functions that require uncertainty estimates (like Expected Improvement), MatCraft uses **MC Dropout**: at inference time, dropout layers remain active and multiple forward passes produce a distribution of predictions. The mean and variance of this distribution provide the predicted value and its uncertainty:

\`\`\`python
# Conceptual implementation
predictions = [model.forward_with_dropout(x) for _ in range(20)]
mean = np.mean(predictions, axis=0)
std = np.std(predictions, axis=0)
\`\`\`

### When to Adjust the MLP

The default configuration works well for most problems (5--20 parameters, 100--500 evaluations). Consider adjusting when:

- **Few evaluations (< 50)**: Use a smaller model to prevent overfitting:
  \`\`\`yaml
  surrogate_config:
    hidden_layers: [32, 16]
    dropout: 0.2
  \`\`\`

- **Many parameters (> 30)**: Use a larger model with more capacity:
  \`\`\`yaml
  surrogate_config:
    hidden_layers: [256, 128, 64]
    epochs: 500
  \`\`\`

- **Noisy evaluation function**: Increase dropout and reduce learning rate:
  \`\`\`yaml
  surrogate_config:
    dropout: 0.2
    learning_rate: 0.0005
  \`\`\`

### Alternative Surrogates

While the MLP is the default, MatCraft supports additional surrogate models:

| Model | Best For | Install |
|-------|----------|---------|
| MLP | General purpose, fast training | Included |
| CHGNet | Crystal structure prediction | \`pip install materia[gnn]\` |
| MACE | Atomistic energy/force prediction | \`pip install materia[gnn]\` |
| ONNX | Pre-trained custom models | \`pip install materia[onnx]\` |

### Programmatic Access

\`\`\`python
from materia.surrogate.mlp import MLPSurrogate

surrogate = MLPSurrogate(
    input_dim=5,
    output_dim=2,
    hidden_layers=[128, 64],
    learning_rate=0.001,
)

# Train on existing data
surrogate.fit(X_train, y_train, epochs=200)

# Predict with uncertainty
mean, std = surrogate.predict(X_new, return_std=True)
\`\`\`

### Training Diagnostics

Monitor surrogate quality via the CLI:

\`\`\`bash
materia run --verbose
\`\`\`

Each iteration logs the training loss, validation loss (if sufficient data), and prediction R-squared on held-out data. A well-performing surrogate should show decreasing loss and R-squared above 0.7 after the first few iterations.
`,
};

export default page;
