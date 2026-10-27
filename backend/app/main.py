import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError

from .database import engine, Base
from .routers import auth, menu, orders, inventory, verification, reports
from .services.websocket_manager import ws_manager
from .auth import SECRET_KEY, ALGORITHM

# Ensure tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Cafeteria Pre-Order & Inventory Management System API",
    description="High-concurrency RESTful API & WebSocket server for college cafeteria pre-ordering and recipe-level inventory tracking.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(verification.router)
app.include_router(reports.router)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "service": "Smart Cafeteria Pre-Order & Inventory Management System",
        "database": engine.dialect.name,
        "version": "1.0.0"
    }

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint supporting role-aware dispatch:
    - Kitchen staff receive real-time order alerts and inventory threshold notifications.
    - Customers receive order stage updates (preparing, ready, collected).
    """
    user_id = None
    is_staff = False

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload.get("sub"))
            role = payload.get("role", "customer")
            if role in ["kitchen_staff", "admin"]:
                is_staff = True
        except (JWTError, Exception):
            pass

    await ws_manager.connect(websocket, user_id=user_id, is_staff=is_staff)

    try:
        while True:
            # Client heartbeat / incoming ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id=user_id, is_staff=is_staff)
