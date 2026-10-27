import io
import csv
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Order, OrderItem, MenuItem, Ingredient, 
    InventoryTransaction, InventoryTxType, OrderStatus, User
)
from ..schemas import DailySalesSummary
from ..auth import get_staff_user, get_admin_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db), staff: User = Depends(get_staff_user)):
    total_orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(Order.status == OrderStatus.COLLECTED).count()
    active_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP])
    ).count()
    cancelled_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.CANCELLED, OrderStatus.REJECTED])
    ).count()

    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status.in_([OrderStatus.COLLECTED, OrderStatus.READY_FOR_PICKUP, OrderStatus.PREPARING, OrderStatus.ACCEPTED])
    ).scalar() or 0.0

    # Low stock items count
    low_stock_count = 0
    all_ingredients = db.query(Ingredient).all()
    for ing in all_ingredients:
        if ing.available_stock <= ing.minimum_threshold:
            low_stock_count += 1

    # Wastage calculation
    spoilage_txs = db.query(InventoryTransaction).filter(
        InventoryTransaction.transaction_type == InventoryTxType.WASTE_SPOILAGE
    ).all()
    total_waste_units = sum(abs(t.quantity_change) for t in spoilage_txs)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "active_orders": active_orders,
        "cancelled_orders": cancelled_orders,
        "low_stock_ingredients": low_stock_count,
        "total_waste_incidents": len(spoilage_txs),
        "total_waste_units": round(total_waste_units, 2)
    }

@router.get("/top-items")
def get_top_selling_items(limit: int = 5, db: Session = Depends(get_db), staff: User = Depends(get_staff_user)):
    results = db.query(
        MenuItem.name,
        MenuItem.category,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.subtotal).label("total_revenue")
    ).join(OrderItem, MenuItem.id == OrderItem.menu_item_id)\
     .group_by(MenuItem.id)\
     .order_by(func.sum(OrderItem.quantity).desc())\
     .limit(limit).all()

    return [
        {
            "name": r[0],
            "category": r[1],
            "units_sold": int(r[2] or 0),
            "revenue": round(float(r[3] or 0.0), 2)
        } for r in results
    ]

@router.get("/export/csv")
def export_csv_report(
    report_type: str = Query(..., regex="^(sales|inventory|waste)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "sales":
        writer.writerow(["Order Number", "Date", "Customer ID", "Status", "Total Amount ($)", "Tax ($)"])
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
        for ord in orders:
            writer.writerow([
                ord.order_number,
                ord.created_at.strftime("%Y-%m-%d %H:%M"),
                ord.customer_id,
                ord.status.value,
                ord.total_amount,
                ord.tax_amount
            ])

    elif report_type == "inventory":
        writer.writerow(["Ingredient Name", "Category", "Current Stock", "Reserved", "Available", "Unit", "Min Threshold", "Expiry Date"])
        ingredients = db.query(Ingredient).order_by(Ingredient.category.asc()).all()
        for ing in ingredients:
            writer.writerow([
                ing.name,
                ing.category,
                ing.current_stock,
                ing.reserved_stock,
                ing.available_stock,
                ing.unit,
                ing.minimum_threshold,
                ing.expiry_date.strftime("%Y-%m-%d") if ing.expiry_date else "N/A"
            ])

    elif report_type == "waste":
        writer.writerow(["Date", "Ingredient ID", "Quantity Lost", "Reason"])
        spoilages = db.query(InventoryTransaction).filter(
            InventoryTransaction.transaction_type == InventoryTxType.WASTE_SPOILAGE
        ).all()
        for sp in spoilages:
            writer.writerow([
                sp.created_at.strftime("%Y-%m-%d %H:%M"),
                sp.ingredient_id,
                abs(sp.quantity_change),
                sp.reason
            ])

    output.seek(0)
    filename = f"smart_cafeteria_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
