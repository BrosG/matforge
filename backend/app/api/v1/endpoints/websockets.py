"""WebSocket endpoints for real-time campaign updates."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/campaign/{campaign_id}")
async def campaign_ws(websocket: WebSocket, campaign_id: str):
    """Stream real-time updates for a running campaign.

    Subscribes to Redis pub/sub channel ws:campaign:{campaign_id}
    and forwards messages to the connected WebSocket client.
    """
    await websocket.accept()

    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        r = aioredis.from_url(settings.WEBSOCKET_REDIS_URL, decode_responses=True)
        pubsub = r.pubsub()
        channel = f"ws:campaign:{campaign_id}"
        await pubsub.subscribe(channel)

        async def listen_redis():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    await websocket.send_text(data)
                    parsed = json.loads(data) if isinstance(data, str) else data
                    if isinstance(parsed, dict) and parsed.get("type") in (
                        "CAMPAIGN_COMPLETE",
                        "CAMPAIGN_FAILED",
                    ):
                        return

        async def listen_client():
            try:
                while True:
                    await websocket.receive_text()
            except WebSocketDisconnect:
                return

        done, pending = await asyncio.wait(
            [
                asyncio.create_task(listen_redis()),
                asyncio.create_task(listen_client()),
            ],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()

        await pubsub.unsubscribe(channel)
        await r.close()

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for campaign {campaign_id}")
    except Exception as e:
        logger.error(f"WebSocket error for campaign {campaign_id}: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
