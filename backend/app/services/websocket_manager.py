from typing import List, Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("smart_cafeteria.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets
        self.active_user_connections: Dict[int, Set[WebSocket]] = {}
        # Set of active staff and admin WebSockets
        self.staff_connections: Set[WebSocket] = set()
        # General broadcast pool
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int = None, is_staff: bool = False):
        await websocket.accept()
        self.all_connections.add(websocket)

        if is_staff:
            self.staff_connections.add(websocket)

        if user_id is not None:
            if user_id not in self.active_user_connections:
                self.active_user_connections[user_id] = set()
            self.active_user_connections[user_id].add(websocket)
        
        logger.info(f"WebSocket connected. User: {user_id}, Staff: {is_staff}")

    def disconnect(self, websocket: WebSocket, user_id: int = None, is_staff: bool = False):
        self.all_connections.discard(websocket)
        if is_staff:
            self.staff_connections.discard(websocket)
        if user_id and user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        logger.info(f"WebSocket disconnected. User: {user_id}")

    async def broadcast_to_staff(self, event_type: str, data: dict):
        """Dispatches an event specifically to connected kitchen and admin staff."""
        message = json.dumps({"event": event_type, "payload": data})
        dead_sockets = []
        for connection in list(self.staff_connections):
            try:
                await connection.send_text(message)
            except Exception:
                dead_sockets.append(connection)
        for dead in dead_sockets:
            self.staff_connections.discard(dead)
            self.all_connections.discard(dead)

    async def send_to_user(self, user_id: int, event_type: str, data: dict):
        """Sends targeted notification to specific customer (e.g. order ready)."""
        if user_id not in self.active_user_connections:
            return
        message = json.dumps({"event": event_type, "payload": data})
        dead_sockets = []
        for connection in list(self.active_user_connections[user_id]):
            try:
                await connection.send_text(message)
            except Exception:
                dead_sockets.append(connection)
        for dead in dead_sockets:
            self.active_user_connections[user_id].discard(dead)
            self.all_connections.discard(dead)

    async def broadcast_all(self, event_type: str, data: dict):
        """Broadcasts globally (e.g. menu item stock out or restock)."""
        message = json.dumps({"event": event_type, "payload": data})
        dead_sockets = []
        for connection in list(self.all_connections):
            try:
                await connection.send_text(message)
            except Exception:
                dead_sockets.append(connection)
        for dead in dead_sockets:
            self.all_connections.discard(dead)

ws_manager = ConnectionManager()
