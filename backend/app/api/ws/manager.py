from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, key: str) -> None:
        await websocket.accept()
        self.connections.setdefault(key, []).append(websocket)

    def disconnect(self, websocket: WebSocket, key: str) -> None:
        sockets = self.connections.get(key)
        if sockets is None:
            return

        if websocket in sockets:
            sockets.remove(websocket)

        if not sockets:
            del self.connections[key]

    async def broadcast(self, message: Any, key: str) -> None:
        sockets = self.connections.get(key)
        if sockets is None:
            return

        for websocket in sockets.copy():
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(websocket, key)

    async def send_personal_message(self, message: Any, key: str) -> None:
        await self.broadcast(message, key)


manager = ConnectionManager()
