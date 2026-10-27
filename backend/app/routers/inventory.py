from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ingredient, InventoryTransaction, InventoryTxType, User
from ..schemas import (
    IngredientCreate, IngredientUpdate, IngredientResponse, 
    StockAdjustmentRequest, InventoryTransactionResponse, LowStockAlert
)
from ..services.inventory_service import InventoryService
from ..services.websocket_manager import ws_manager
from ..auth import get_staff_user, get_admin_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])

@router.get("/ingredients", response_model=List[IngredientResponse])
def get_ingredients(
    category: Optional[str] = Query(None),
    low_stock_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    staff: User = Depends(get_staff_user)
):
    query = db.query(Ingredient)
    if category:
        query = query.filter(Ingredient.category.ilike(category))

    ingredients = query.order_by(Ingredient.name.asc()).all()
    results = []

    for ing in ingredients:
        if low_stock_only and ing.available_stock > ing.minimum_threshold:
            continue
        results.append(IngredientResponse(
            id=ing.id,
            name=ing.name,
            category=ing.category,
            unit=ing.unit,
            current_stock=ing.current_stock,
            reserved_stock=ing.reserved_stock,
            available_stock=ing.available_stock,
            minimum_threshold=ing.minimum_threshold,
            cost_per_unit=ing.cost_per_unit,
            expiry_date=ing.expiry_date,
            supplier_info=ing.supplier_info,
            last_updated=ing.last_updated
        ))

    return results

@router.post("/ingredients", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    ing_in: IngredientCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    existing = db.query(Ingredient).filter(Ingredient.name.ilike(ing_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Ingredient '{ing_in.name}' already exists.")

    ingredient = Ingredient(
        name=ing_in.name,
        category=ing_in.category,
        unit=ing_in.unit,
        current_stock=ing_in.current_stock,
        minimum_threshold=ing_in.minimum_threshold,
        cost_per_unit=ing_in.cost_per_unit,
        expiry_date=ing_in.expiry_date,
        supplier_info=ing_in.supplier_info
    )
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)

    # Initial inventory record
    if ingredient.current_stock > 0:
        audit = InventoryTransaction(
            ingredient_id=ingredient.id,
            user_id=admin.id,
            transaction_type=InventoryTxType.PURCHASE,
            quantity_change=ingredient.current_stock,
            balance_after=ingredient.current_stock,
            reason="Initial stock entry"
        )
        db.add(audit)
        db.commit()

    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        category=ingredient.category,
        unit=ingredient.unit,
        current_stock=ingredient.current_stock,
        reserved_stock=ingredient.reserved_stock,
        available_stock=ingredient.available_stock,
        minimum_threshold=ingredient.minimum_threshold,
        cost_per_unit=ingredient.cost_per_unit,
        expiry_date=ingredient.expiry_date,
        supplier_info=ingredient.supplier_info,
        last_updated=ingredient.last_updated
    )

@router.post("/adjust", response_model=IngredientResponse)
async def adjust_stock(
    adj_in: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    staff: User = Depends(get_staff_user)
):
    ingredient = InventoryService.adjust_stock(
        db=db,
        ingredient_id=adj_in.ingredient_id,
        quantity_change=adj_in.quantity_change,
        tx_type=adj_in.transaction_type,
        reason=adj_in.reason,
        user_id=staff.id
    )
    db.commit()
    db.refresh(ingredient)

    # Broadcast inventory update to staff
    await ws_manager.broadcast_to_staff("INVENTORY_UPDATED", {
        "ingredient_id": ingredient.id,
        "name": ingredient.name,
        "new_stock": ingredient.available_stock,
        "unit": ingredient.unit
    })

    # Check if stock dropped below threshold
    if ingredient.available_stock <= ingredient.minimum_threshold:
        await ws_manager.broadcast_to_staff("LOW_STOCK_ALERT", {
            "ingredient_id": ingredient.id,
            "name": ingredient.name,
            "current_stock": ingredient.available_stock,
            "threshold": ingredient.minimum_threshold,
            "unit": ingredient.unit
        })

    return IngredientResponse(
        id=ingredient.id,
        name=ingredient.name,
        category=ingredient.category,
        unit=ingredient.unit,
        current_stock=ingredient.current_stock,
        reserved_stock=ingredient.reserved_stock,
        available_stock=ingredient.available_stock,
        minimum_threshold=ingredient.minimum_threshold,
        cost_per_unit=ingredient.cost_per_unit,
        expiry_date=ingredient.expiry_date,
        supplier_info=ingredient.supplier_info,
        last_updated=ingredient.last_updated
    )

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(
    limit: int = 50,
    ingredient_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    staff: User = Depends(get_staff_user)
):
    query = db.query(InventoryTransaction)
    if ingredient_id:
        query = query.filter(InventoryTransaction.ingredient_id == ingredient_id)

    txs = query.order_by(InventoryTransaction.created_at.desc()).limit(limit).all()
    results = []
    for t in txs:
        ing = t.ingredient
        results.append(InventoryTransactionResponse(
            id=t.id,
            ingredient_id=t.ingredient_id,
            ingredient_name=ing.name if ing else "Unknown",
            order_id=t.order_id,
            transaction_type=t.transaction_type,
            quantity_change=t.quantity_change,
            balance_after=t.balance_after,
            reason=t.reason,
            created_at=t.created_at
        ))
    return results

@router.get("/alerts", response_model=List[LowStockAlert])
def get_inventory_alerts(
    db: Session = Depends(get_db),
    staff: User = Depends(get_staff_user)
):
    ingredients = db.query(Ingredient).all()
    alerts = []
    for ing in ingredients:
        if ing.available_stock <= ing.minimum_threshold:
            severity = "CRITICAL" if ing.available_stock == 0 else "WARNING"
            alerts.append(LowStockAlert(
                ingredient_id=ing.id,
                name=ing.name,
                current_stock=ing.available_stock,
                minimum_threshold=ing.minimum_threshold,
                unit=ing.unit,
                severity=severity
            ))
    return alerts
