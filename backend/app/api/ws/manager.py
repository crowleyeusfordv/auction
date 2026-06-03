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

    async def connect(self, websocket: WebSocket, auction_id: str, user_id: str, user_name: str = "") -> None:
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

    def disconnect(self, websocket: WebSocket, auction_id: str, user_id: str) -> None:
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

    async def broadcast(self, msg_type: str, payload: Any, auction_id: str) -> None:
        message = {"type": msg_type, "payload": payload}
        users = self.active_connections.get(auction_id, {})
        for user_id, conns in list(users.items()):
            for conn in conns.copy():
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    self.disconnect(conn.websocket, auction_id, user_id)

    async def broadcast_new_bid(self, auction_id: str, new_amount: float, raw_ranking: List[str]) -> None:
        users = self.active_connections.get(auction_id, {})
        names_dict = self.user_names.get(auction_id, {})
        
        # Build ranking array of objects
        ranking_objs = []
        # raw_ranking is [user_id_1, score_1, user_id_2, score_2, ...]
        for i in range(0, len(raw_ranking), 2):
            uid = raw_ranking[i]
            score = float(raw_ranking[i+1])
            name = names_dict.get(uid, "Unknown")
            ranking_objs.append({"name": name, "amount": score})
            
        base_payload = {
            "new_amount": new_amount,
            "ranking": ranking_objs
        }
        
        for user_id, conns in list(users.items()):
            # Find user position in raw_ranking
            position = None
            for i in range(0, len(raw_ranking), 2):
                if raw_ranking[i] == user_id:
                    position = (i // 2) + 1
                    break
                    
            personalized_payload = base_payload.copy()
            if position is not None:
                personalized_payload["your_position"] = position
                
            message = {"type": "new_bid", "payload": personalized_payload}
            
            for conn in conns.copy():
                try:
                    await conn.websocket.send_json(message)
                except Exception:
                    self.disconnect(conn.websocket, auction_id, user_id)

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
