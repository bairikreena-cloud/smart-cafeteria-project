import math
from datetime import datetime
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from ..models import (
    MenuItem, Ingredient, Recipe, RecipeIngredient, 
    InventoryReservation, InventoryTransaction, 
    InventoryTxType, ReservationStatus, Order, OrderStatus
)

class InventoryService:
    @staticmethod
    def calculate_menu_item_availability(db: Session, menu_item_id: int) -> int:
        """
        Calculates the maximum available portions of a menu item based on 
        available stock of each recipe ingredient.
        Formula: min(floor(available_stock_i / required_quantity_i)) for all ingredients i.
        """
        recipe = db.query(Recipe).filter(Recipe.menu_item_id == menu_item_id).first()
        if not recipe or not recipe.ingredients:
            return 999 # Items with no recipe constraints

        max_portions = 999999
        for ri in recipe.ingredients:
            ingredient = db.query(Ingredient).filter(Ingredient.id == ri.ingredient_id).first()
            if not ingredient:
                return 0
            
            # Check if ingredient is expired
            if ingredient.expiry_date and ingredient.expiry_date < datetime.utcnow():
                return 0

            available = ingredient.available_stock
            if ri.quantity_required <= 0:
                continue

            possible_portions = math.floor(available / ri.quantity_required)
            if possible_portions < max_portions:
                max_portions = possible_portions

        return max(0, max_portions if max_portions != 999999 else 0)

    @staticmethod
    def reserve_ingredients_for_order(
        db: Session, 
        order: Order, 
        items_requested: List[Dict[str, int]]
    ) -> List[InventoryReservation]:
        """
        Atomically checks and reserves ingredients for an incoming order using row-level locking.
        Prevents overselling during concurrent order placement.
        
        items_requested: list of dicts [{'menu_item_id': 1, 'quantity': 2}, ...]
        """
        # Step 1: Aggregate total ingredient requirements across all order items
        total_ingredient_needed: Dict[int, float] = {}

        for item in items_requested:
            menu_item_id = item["menu_item_id"]
            qty = item["quantity"]

            recipe = db.query(Recipe).filter(Recipe.menu_item_id == menu_item_id).first()
            if not recipe:
                continue

            for ri in recipe.ingredients:
                req_qty = ri.quantity_required * qty
                total_ingredient_needed[ri.ingredient_id] = total_ingredient_needed.get(ri.ingredient_id, 0.0) + req_qty

        # Step 2: Lock and check each required ingredient atomically using row locking
        reservations_created: List[InventoryReservation] = []
        ingredient_ids = sorted(list(total_ingredient_needed.keys()))

        for ing_id in ingredient_ids:
            # Row locking with SELECT ... FOR UPDATE (in Postgres) to prevent race conditions
            # SQLite gracefully falls back without failure
            query = db.query(Ingredient).filter(Ingredient.id == ing_id)
            if db.bind.dialect.name == "postgresql":
                query = query.with_for_update()
            
            ingredient = query.first()
            if not ingredient:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ingredient ID {ing_id} referenced in recipe does not exist."
                )

            # Check expiration
            if ingredient.expiry_date and ingredient.expiry_date < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot order: Ingredient '{ingredient.name}' is expired."
                )

            needed = total_ingredient_needed[ing_id]
            if ingredient.available_stock < needed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for '{ingredient.name}'. "
                        f"Required: {needed} {ingredient.unit}, "
                        f"Available: {ingredient.available_stock} {ingredient.unit}."
                    )
                )

            # Atomically increment reserved stock
            ingredient.reserved_stock += needed

            # Record reservation record
            reservation = InventoryReservation(
                order_id=order.id,
                ingredient_id=ing_id,
                quantity_reserved=needed,
                status=ReservationStatus.HELD,
                created_at=datetime.utcnow()
            )
            db.add(reservation)
            reservations_created.append(reservation)

            # Record audit transaction
            audit_tx = InventoryTransaction(
                ingredient_id=ing_id,
                order_id=order.id,
                user_id=order.customer_id,
                transaction_type=InventoryTxType.ORDER_RESERVATION,
                quantity_change=-needed,
                balance_after=ingredient.available_stock,
                reason=f"Atomic reservation held for Order #{order.order_number}"
            )
            db.add(audit_tx)

        db.flush()
        return reservations_created

    @staticmethod
    def consume_reservations_on_preparation(db: Session, order: Order):
        """
        Called when order transitions to PREPARING or READY_FOR_PICKUP.
        Permanently deducts from current_stock and clears reserved_stock.
        Prevents duplicate deduction by inspecting ReservationStatus.
        """
        reservations = db.query(InventoryReservation).filter(
            InventoryReservation.order_id == order.id,
            InventoryReservation.status == ReservationStatus.HELD
        ).all()

        for res in reservations:
            ingredient = db.query(Ingredient).filter(Ingredient.id == res.ingredient_id).first()
            if ingredient:
                # Decrement physical stock and clear hold
                ingredient.current_stock = max(0.0, ingredient.current_stock - res.quantity_reserved)
                ingredient.reserved_stock = max(0.0, ingredient.reserved_stock - res.quantity_reserved)
                
                # Mark reservation as consumed
                res.status = ReservationStatus.CONSUMED
                res.resolved_at = datetime.utcnow()

                # Audit transaction
                audit_tx = InventoryTransaction(
                    ingredient_id=ingredient.id,
                    order_id=order.id,
                    user_id=order.customer_id,
                    transaction_type=InventoryTxType.ORDER_CONSUMPTION,
                    quantity_change=-res.quantity_reserved,
                    balance_after=ingredient.current_stock,
                    reason=f"Physical consumption fulfilled for Order #{order.order_number}"
                )
                db.add(audit_tx)

        db.flush()

    @staticmethod
    def release_reservations_on_cancellation(db: Session, order: Order, reason: str = "Order Cancelled"):
        """
        Releases reserved ingredients back into available inventory when an order is cancelled or rejected.
        Only releases if the order was not already consumed.
        """
        reservations = db.query(InventoryReservation).filter(
            InventoryReservation.order_id == order.id,
            InventoryReservation.status == ReservationStatus.HELD
        ).all()

        for res in reservations:
            ingredient = db.query(Ingredient).filter(Ingredient.id == res.ingredient_id).first()
            if ingredient:
                # Release reserved hold
                ingredient.reserved_stock = max(0.0, ingredient.reserved_stock - res.quantity_reserved)
                
                res.status = ReservationStatus.RELEASED
                res.resolved_at = datetime.utcnow()

                # Audit transaction
                audit_tx = InventoryTransaction(
                    ingredient_id=ingredient.id,
                    order_id=order.id,
                    user_id=order.customer_id,
                    transaction_type=InventoryTxType.ORDER_CANCELLATION_RESTORE,
                    quantity_change=res.quantity_reserved,
                    balance_after=ingredient.available_stock,
                    reason=f"Reservation released: {reason}"
                )
                db.add(audit_tx)

        db.flush()

    @staticmethod
    def adjust_stock(
        db: Session, 
        ingredient_id: int, 
        quantity_change: float, 
        tx_type: InventoryTxType, 
        reason: str,
        user_id: int = None
    ) -> Ingredient:
        """
        Manual stock adjustments (purchases, deliveries, waste/spoilage, physical audit).
        """
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")

        new_stock = ingredient.current_stock + quantity_change
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Stock adjustment would result in negative inventory.")

        ingredient.current_stock = new_stock
        ingredient.last_updated = datetime.utcnow()

        audit = InventoryTransaction(
            ingredient_id=ingredient.id,
            user_id=user_id,
            transaction_type=tx_type,
            quantity_change=quantity_change,
            balance_after=ingredient.current_stock,
            reason=reason
        )
        db.add(audit)
        db.flush()
        return ingredient
