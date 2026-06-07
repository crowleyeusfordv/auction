import time
from typing import Any, Dict, List
from fastapi import WebSocket
from dataclasses import dataclass

@dataclass
class ConnectionData:
    websocket: WebSocket
    last_heartbeat: float

class ConnectionManager:
    def __init__(self) -> None:
        # auction_id -> user_id -> list of ConnectionData
        self.active_connections: Dict[str, Dict[str, List[ConnectionData]]] = {}
        # auction_id -> user_id -> user_name
        self.user_names: Dict[str, Dict[str, str]] = {}
        # auction_id -> count of virtual bot viewers (no real WS)
        self.bot_viewer_counts: Dict[str, int] = {}

    async def connect(
        self,
        websocket: WebSocket,
        auction_id: str,
        user_id: str,
        user_name: str = "",
        *,
        notify_viewer_count: bool = True,
    ) -> None:
        await websocket.accept()
        
        if auction_id not in self.active_connections:
            self.active_connections[auction_id] = {}
            self.user_names[auction_id] = {}
            
        if user_id not in self.active_connections[auction_id]:
            self.active_connections[auction_id][user_id] = []
            self.user_names[auction_id][user_id] = user_name
            
        user_conns = self.active_connections[auction_id][user_id]
        
        # Enforce max 5 connections
        if len(user_conns) >= 5:
            oldest = user_conns.pop(0)
            try:
                await oldest.websocket.close(code=1000)
            except Exception:
                pass
            
        user_conns.append(ConnectionData(websocket=websocket, last_heartbeat=time.time()))
        if notify_viewer_count:
            import asyncio
            asyncio.create_task(self.broadcast("viewer_count", {"count": self.get_viewer_count(auction_id)}, auction_id))

    def disconnect(
        self,
        websocket: WebSocket,
        auction_id: str,
        user_id: str,
        *,
        notify_viewer_count: bool = True,
    ) -> None:
        user_conns = self.active_connections.get(auction_id, {}).get(user_id, [])
        for conn in user_conns:
            if conn.websocket == websocket:
                user_conns.remove(conn)
                break
                
        if auction_id in self.active_connections and user_id in self.active_connections[auction_id]:
            if not self.active_connections[auction_id][user_id]:
                del self.active_connections[auction_id][user_id]
                self.user_names[auction_id].pop(user_id, None)
            if not self.active_connections[auction_id]:
                del self.active_connections[auction_id]
                self.user_names.pop(auction_id, None)
        
        if notify_viewer_count:
            import asyncio
            asyncio.create_task(self.broadcast("viewer_count", {"count": self.get_viewer_count(auction_id)}, auction_id))

    def _to_camel_case(self, data: Any) -> Any:
        from pydantic.alias_generators import to_camel
        if isinstance(data, dict):
            return {to_camel(k): self._to_camel_case(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._to_camel_case(v) for v in data]
        return data

    async def broadcast(self, msg_type: str, payload: Any, auction_id: str) -> None:
        camel_payload = self._to_camel_case(payload)
        message = {"type": msg_type, **camel_payload} if isinstance(camel_payload, dict) else {"type": msg_type, "payload": camel_payload}
        users = self.active_connections.get(auction_id, {})
        for user_id, conns in list(users.items()):
            for conn in conns.copy():
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    self.disconnect(conn.websocket, auction_id, user_id)

    async def send_personalized(
        self,
        msg_type: str,
        payloads_by_user: Dict[str, Any],
        auction_id: str,
    ) -> None:
        users = self.active_connections.get(auction_id, {})
        for user_id, conns in list(users.items()):
            payload = payloads_by_user.get(user_id)
            if payload is None:
                continue

            camel_payload = self._to_camel_case(payload)
            message = {"type": msg_type, **camel_payload} if isinstance(camel_payload, dict) else {"type": msg_type, "payload": camel_payload}
            for conn in conns.copy():
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    self.disconnect(conn.websocket, auction_id, user_id)

    async def send_to_user(self, room_key: str, user_id: str, message: Dict[str, Any]) -> bool:
        camel_message = self._to_camel_case(message)
        users = self.active_connections.get(room_key, {})
        conns = users.get(user_id, [])
        delivered = False

        for conn in conns.copy():
            try:
                await conn.websocket.send_json(camel_message)
                delivered = True
            except Exception:
                self.disconnect(conn.websocket, room_key, user_id)

        return delivered

    def get_connected_user_ids(self, auction_id: str) -> List[str]:
        return list(self.active_connections.get(auction_id, {}).keys())

    def get_viewer_count(self, auction_id: str) -> int:
        real = sum(
            len(conns)
            for conns in self.active_connections.get(auction_id, {}).values()
        )
        bots = self.bot_viewer_counts.get(auction_id, 0)
        return real + bots

    def add_bot_viewers(self, auction_id: str, count: int) -> None:
        self.bot_viewer_counts[auction_id] = self.bot_viewer_counts.get(auction_id, 0) + count

    def remove_bot_viewers(self, auction_id: str, count: int) -> None:
        current = self.bot_viewer_counts.get(auction_id, 0)
        updated = max(0, current - count)
        if updated == 0:
            self.bot_viewer_counts.pop(auction_id, None)
        else:
            self.bot_viewer_counts[auction_id] = updated

    def update_heartbeat(self, websocket: WebSocket, auction_id: str, user_id: str) -> None:
        user_conns = self.active_connections.get(auction_id, {}).get(user_id, [])
        for conn in user_conns:
            if conn.websocket == websocket:
                conn.last_heartbeat = time.time()
                break

    async def disconnect_all(self, auction_id: str) -> None:
        users = self.active_connections.get(auction_id, {})
        for user_id, conns in list(users.items()):
            for conn in conns:
                try:
                    await conn.websocket.close(code=1000)
                except Exception:
                    pass
        if auction_id in self.active_connections:
            del self.active_connections[auction_id]
        self.user_names.pop(auction_id, None)

    async def start_heartbeat_pruning(self) -> None:
        import asyncio
        while True:
            await asyncio.sleep(10)
            now = time.time()
            for auction_id, users in list(self.active_connections.items()):
                for user_id, conns in list(users.items()):
                    for conn in conns.copy():
                        if now - conn.last_heartbeat > 60:
                            try:
                                await conn.websocket.close(code=1000)
                            except Exception:
                                pass
                            self.disconnect(conn.websocket, auction_id, user_id)

manager = ConnectionManager()
