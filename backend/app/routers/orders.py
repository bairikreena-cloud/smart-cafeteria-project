import random
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Order, OrderItem, MenuItem, Payment, PickupVerification, 
    OrderStatus, PaymentStatus, PaymentMethod, User, Notification
)
from ..schemas import OrderCreate, OrderResponse, OrderItemResponse, OrderStatusUpdate
from ..services.inventory_service import InventoryService
from ..services.websocket_manager import ws_manager
from ..auth import get_current_user, get_staff_user

router = APIRouter(prefix="/api/orders", tags=["Order Management"])

def generate_order_number() -> str:
    year = datetime.utcnow().year
    rand_suffix = random.randint(1000, 9999)
    return f"CB-{year}-{rand_suffix}"

def generate_pickup_code() -> str:
    return f"{random.randint(1000, 9999)}"

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    # Calculate item details & total
    subtotal = 0.0
    items_to_create = []
    items_requested_data = []

    for item_req in order_in.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_req.menu_item_id).first()
        if not menu_item or not menu_item.is_manually_available:
            raise HTTPException(status_code=400, detail=f"Menu item {item_req.menu_item_id} is currently unavailable.")

        item_subtotal = menu_item.price * item_req.quantity
        subtotal += item_subtotal

        items_to_create.append({
            "menu_item_id": menu_item.id,
            "quantity": item_req.quantity,
            "unit_price": menu_item.price,
            "subtotal": item_subtotal,
            "menu_item_name": menu_item.name
        })

        items_requested_data.append({
            "menu_item_id": menu_item.id,
            "quantity": item_req.quantity
        })

    tax_amount = round(subtotal * 0.05, 2) # 5% campus tax / facility fee
    total_amount = round(subtotal + tax_amount, 2)

    # Create Order object
    order = Order(
        order_number=generate_order_number(),
        customer_id=current_user.id,
        status=OrderStatus.PENDING,
        scheduled_pickup_time=order_in.scheduled_pickup_time,
        total_amount=total_amount,
        tax_amount=tax_amount,
        customer_notes=order_in.customer_notes
    )
    db.add(order)
    db.flush()

    # Step: Atomically reserve required ingredients based on recipes
    # Raises HTTPException if stock is insufficient
    InventoryService.reserve_ingredients_for_order(db, order, items_requested_data)

    # Create OrderItems
    order_items_models = []
    for it in items_to_create:
        oi = OrderItem(
            order_id=order.id,
            menu_item_id=it["menu_item_id"],
            quantity=it["quantity"],
            unit_price=it["unit_price"],
            subtotal=it["subtotal"]
        )
        db.add(oi)
        order_items_models.append(oi)

    # Create Transparent Mock Payment
    payment = Payment(
        order_id=order.id,
        method=order_in.payment_method,
        status=PaymentStatus.PAID,
        transaction_reference=f"MOCK-TXN-{uuid.uuid4().hex[:12].upper()}",
        amount=total_amount,
        is_mock=True
    )
    db.add(payment)

    # Generate 4-digit pickup verification code
    pickup_code = generate_pickup_code()
    verification = PickupVerification(
        order_id=order.id,
        verification_code=pickup_code,
        is_verified=False
    )
    db.add(verification)

    # Create customer notification
    notif = Notification(
        user_id=current_user.id,
        title="Order Placed Successfully",
        message=f"Order #{order.order_number} has been placed. Pickup code: {pickup_code}",
        notification_type="order_placed",
        related_order_id=order.id
    )
    db.add(notif)

    db.commit()
    db.refresh(order)

    # Build response
    resp_items = [
        OrderItemResponse(
            id=oi.id,
            menu_item_id=oi.menu_item_id,
            menu_item_name=it["menu_item_name"],
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            subtotal=oi.subtotal
        ) for oi, it in zip(order_items_models, items_to_create)
    ]

    order_response_dict = {
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "customer_name": current_user.full_name,
        "status": order.status.value,
        "scheduled_pickup_time": order.scheduled_pickup_time.isoformat(),
        "total_amount": order.total_amount,
        "items": [it["menu_item_name"] + f" (x{it['quantity']})" for it in items_to_create]
    }

    # Broadcast to kitchen staff via WebSockets in real time!
    await ws_manager.broadcast_to_staff("NEW_ORDER", order_response_dict)

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        customer_name=current_user.full_name,
        status=order.status,
        scheduled_pickup_time=order.scheduled_pickup_time,
        actual_pickup_time=order.actual_pickup_time,
        total_amount=order.total_amount,
        tax_amount=order.tax_amount,
        customer_notes=order.customer_notes,
        cancellation_reason=order.cancellation_reason,
        created_at=order.created_at,
        items=resp_items,
        verification_code=pickup_code,
        payment_status=payment.status.value
    )

@router.get("", response_model=List[OrderResponse])
def get_orders(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Staff sees all incoming cafeteria orders.
    Customers see only their own orders.
    """
    query = db.query(Order)
    is_staff = current_user.role and current_user.role.name in ["kitchen_staff", "admin"]

    if not is_staff:
        query = query.filter(Order.customer_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.created_at.desc()).all()
    results = []

    for ord in orders:
        items_resp = []
        for itm in ord.items:
            m_item = db.query(MenuItem).filter(MenuItem.id == itm.menu_item_id).first()
            items_resp.append(OrderItemResponse(
                id=itm.id,
                menu_item_id=itm.menu_item_id,
                menu_item_name=m_item.name if m_item else "Unknown Item",
                quantity=itm.quantity,
                unit_price=itm.unit_price,
                subtotal=itm.subtotal
            ))

        code = ord.verification.verification_code if ord.verification else None
        # Hide verification code from non-staff/non-owner if necessary
        results.append(OrderResponse(
            id=ord.id,
            order_number=ord.order_number,
            customer_id=ord.customer_id,
            customer_name=ord.customer.full_name if ord.customer else "Guest",
            status=ord.status,
            scheduled_pickup_time=ord.scheduled_pickup_time,
            actual_pickup_time=ord.actual_pickup_time,
            total_amount=ord.total_amount,
            tax_amount=ord.tax_amount,
            customer_notes=ord.customer_notes,
            cancellation_reason=ord.cancellation_reason,
            created_at=ord.created_at,
            items=items_resp,
            verification_code=code,
            payment_status=ord.payment.status.value if ord.payment else None
        ))

    return results

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_staff = current_user.role and current_user.role.name in ["kitchen_staff", "admin"]
    old_status = order.status
    new_status = status_update.status

    # Business rule: Customer can only cancel if order is in PENDING or ACCEPTED status
    if not is_staff:
        if order.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        if new_status != OrderStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Customers may only request order cancellation.")
        if old_status in [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.COLLECTED]:
            raise HTTPException(
                status_code=400, 
                detail="Cannot cancel order once food preparation has begun."
            )

    # Handle Inventory State Transitions
    if new_status in [OrderStatus.CANCELLED, OrderStatus.REJECTED]:
        reason = status_update.cancellation_reason or "Customer cancellation"
        order.cancellation_reason = reason
        InventoryService.release_reservations_on_cancellation(db, order, reason=reason)
    
    elif new_status in [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP]:
        # Permanently consume reserved inventory
        InventoryService.consume_reservations_on_preparation(db, order)

    elif new_status == OrderStatus.COLLECTED:
        order.actual_pickup_time = datetime.utcnow()

    order.status = new_status
    db.commit()
    db.refresh(order)

    # Real-time WebSocket alerts
    event_payload = {
        "order_id": order.id,
        "order_number": order.order_number,
        "new_status": new_status.value,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Broadcast to staff and specific customer
    await ws_manager.broadcast_to_staff("ORDER_STATUS_CHANGED", event_payload)
    await ws_manager.send_to_user(order.customer_id, "ORDER_STATUS_CHANGED", event_payload)

    # Also notify user in database
    notif = Notification(
        user_id=order.customer_id,
        title=f"Order #{order.order_number} Update",
        message=f"Your order status is now: {new_status.value.replace('_', ' ').title()}",
        notification_type="order_status_update",
        related_order_id=order.id
    )
    db.add(notif)
    db.commit()

    return await get_single_order(order.id, db)

async def get_single_order(order_id: int, db: Session) -> OrderResponse:
    ord = db.query(Order).filter(Order.id == order_id).first()
    items_resp = []
    for itm in ord.items:
        m_item = db.query(MenuItem).filter(MenuItem.id == itm.menu_item_id).first()
        items_resp.append(OrderItemResponse(
            id=itm.id,
            menu_item_id=itm.menu_item_id,
            menu_item_name=m_item.name if m_item else "Unknown Item",
            quantity=itm.quantity,
            unit_price=itm.unit_price,
            subtotal=itm.subtotal
        ))
    return OrderResponse(
        id=ord.id,
        order_number=ord.order_number,
        customer_id=ord.customer_id,
        customer_name=ord.customer.full_name if ord.customer else "Guest",
        status=ord.status,
        scheduled_pickup_time=ord.scheduled_pickup_time,
        actual_pickup_time=ord.actual_pickup_time,
        total_amount=ord.total_amount,
        tax_amount=ord.tax_amount,
        customer_notes=ord.customer_notes,
        cancellation_reason=ord.cancellation_reason,
        created_at=ord.created_at,
        items=items_resp,
        verification_code=ord.verification.verification_code if ord.verification else None,
        payment_status=ord.payment.status.value if ord.payment else None
    )
