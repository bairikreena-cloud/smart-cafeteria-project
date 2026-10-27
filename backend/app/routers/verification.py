from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, PickupVerification, OrderStatus, User, Notification
from ..schemas import PickupVerificationRequest, OrderResponse
from ..services.websocket_manager import ws_manager
from ..auth import get_staff_user
from .orders import get_single_order

router = APIRouter(prefix="/api/verification", tags=["Pickup Verification"])

@router.post("/verify", response_model=OrderResponse)
async def verify_pickup_code(
    req: PickupVerificationRequest,
    db: Session = Depends(get_db),
    staff: User = Depends(get_staff_user)
):
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="This order has already been marked as collected.")

    if order.status not in [OrderStatus.READY_FOR_PICKUP, OrderStatus.PREPARING]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot collect order in '{order.status.value}' state. Order must be ready."
        )

    verification = order.verification
    if not verification:
        raise HTTPException(status_code=400, detail="No verification record found for this order.")

    # Strict code match check
    if verification.verification_code.strip() != req.verification_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pickup verification code. Please ask the customer to check their app screen."
        )

    # Success: Mark verified & collected
    verification.is_verified = True
    verification.verified_by_user_id = staff.id
    verification.verified_at = datetime.utcnow()

    order.status = OrderStatus.COLLECTED
    order.actual_pickup_time = datetime.utcnow()

    notif = Notification(
        user_id=order.customer_id,
        title="Meal Collected",
        message=f"Order #{order.order_number} was successfully collected. Enjoy your meal!",
        notification_type="order_collected",
        related_order_id=order.id
    )
    db.add(notif)
    db.commit()

    # Real-time WebSocket alerts
    await ws_manager.broadcast_to_staff("ORDER_STATUS_CHANGED", {
        "order_id": order.id,
        "order_number": order.order_number,
        "new_status": OrderStatus.COLLECTED.value,
        "timestamp": datetime.utcnow().isoformat()
    })
    await ws_manager.send_to_user(order.customer_id, "ORDER_COLLECTED", {
        "order_id": order.id,
        "order_number": order.order_number,
        "message": "Pickup code verified! Meal collected."
    })

    return await get_single_order(order.id, db)
