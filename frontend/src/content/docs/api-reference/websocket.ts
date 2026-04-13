import { DocPage } from "../index";

const page: DocPage = {
  slug: "websocket",
  title: "WebSocket API",
  description: "Real-time campaign progress streaming via WebSocket connections.",
  category: "api-reference",
  order: 5,
  lastUpdated: "2026-04-01",
  tags: ["api", "websocket", "real-time", "streaming"],
  readingTime: 6,
  body: `
## WebSocket API

The WebSocket API provides real-time progress updates for running campaigns. Instead of polling the REST API, clients can subscribe to a campaign's WebSocket channel and receive push notifications as the optimization progresses.

### Connecting

\`\`\`
wss://api.matcraft.ai/api/v1/ws/campaigns/{campaign_id}?token={api_key}
\`\`\`

For self-hosted deployments:

\`\`\`
ws://localhost:8000/v1/ws/campaigns/{campaign_id}?token={api_key}
\`\`\`

### JavaScript Client Example

\`\`\`javascript
const ws = new WebSocket(
  "wss://api.matcraft.ai/api/v1/ws/campaigns/camp_abc123?token=mc_live_abc123"
);

ws.onopen = () => {
  console.log("Connected to campaign stream");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case "iteration_start":
      console.log(\`Iteration \${message.data.iteration} starting\`);
      break;
    case "iteration_complete":
      console.log(\`Iteration \${message.data.iteration} complete\`);
      console.log(\`Hypervolume: \${message.data.hypervolume}\`);
      break;
    case "campaign_complete":
      console.log("Campaign finished!");
      ws.close();
      break;
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};
\`\`\`

### Python Client Example

\`\`\`python
import asyncio
import websockets
import json

async def monitor_campaign(campaign_id, api_key):
    uri = f"wss://api.matcraft.ai/api/v1/ws/campaigns/{campaign_id}?token={api_key}"

    async with websockets.connect(uri) as ws:
        async for message in ws:
            data = json.loads(message)
            if data["type"] == "iteration_complete":
                print(f"Iter {data['data']['iteration']}: HV={data['data']['hypervolume']:.4f}")
            elif data["type"] == "campaign_complete":
                print("Campaign finished!")
                break

asyncio.run(monitor_campaign("camp_abc123", "mc_live_abc123"))
\`\`\`

### Message Types

#### iteration_start

Sent when a new iteration begins:

\`\`\`json
{
  "type": "iteration_start",
  "timestamp": "2026-04-01T10:05:00Z",
  "data": {
    "iteration": 5,
    "total_iterations": 20,
    "phase": "evaluating",
    "batch_size": 15
  }
}
\`\`\`

#### evaluation_complete

Sent when a single candidate evaluation finishes:

\`\`\`json
{
  "type": "evaluation_complete",
  "timestamp": "2026-04-01T10:05:12Z",
  "data": {
    "iteration": 5,
    "evaluation_index": 3,
    "batch_size": 15,
    "objectives": {"permeability": 28.4, "salt_rejection": 96.2}
  }
}
\`\`\`

#### iteration_complete

Sent when an iteration finishes (all evaluations done, surrogate retrained, next batch acquired):

\`\`\`json
{
  "type": "iteration_complete",
  "timestamp": "2026-04-01T10:06:30Z",
  "data": {
    "iteration": 5,
    "evaluations_completed": 75,
    "hypervolume": 0.682,
    "hypervolume_improvement": 0.034,
    "pareto_size": 11,
    "surrogate_loss": 0.0192,
    "best_objectives": {
      "permeability": 35.1,
      "salt_rejection": 97.8
    }
  }
}
\`\`\`

#### campaign_complete

Sent when the campaign finishes (budget exhausted or converged):

\`\`\`json
{
  "type": "campaign_complete",
  "timestamp": "2026-04-01T10:30:00Z",
  "data": {
    "status": "converged",
    "total_iterations": 15,
    "total_evaluations": 225,
    "final_hypervolume": 0.847,
    "pareto_size": 18
  }
}
\`\`\`

#### error

Sent when an error occurs:

\`\`\`json
{
  "type": "error",
  "timestamp": "2026-04-01T10:05:00Z",
  "data": {
    "code": "SURROGATE_TRAINING_FAILED",
    "message": "NaN detected in surrogate predictions",
    "iteration": 5
  }
}
\`\`\`

### Connection Management

- **Heartbeat**: The server sends a ping frame every 30 seconds. Clients must respond with a pong to keep the connection alive.
- **Reconnection**: If the connection drops, clients should reconnect and will receive messages from the current point forward. Missed messages are not replayed.
- **Multiple clients**: Multiple WebSocket clients can subscribe to the same campaign simultaneously.
- **Idle timeout**: Connections are closed after 10 minutes of inactivity (no campaign progress).

### Rate Limits

WebSocket connections are subject to the same rate limits as the REST API. Each API key can maintain up to 10 simultaneous WebSocket connections.
`,
};

export default page;
