from datetime import datetime, timedelta
from app.models import Ingredient, MenuItem, Order, OrderStatus

def get_auth_header(client, email="student@campus.edu", password="testpass123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_order_placement_reserves_stock(client, db_session):
    headers = get_auth_header(client)
    menu_item = db_session.query(MenuItem).filter(MenuItem.name == "Test Sandwich").first()

    # Place order for 2 sandwiches (Requires 4 bread slices, 2 cheese slices)
    order_payload = {
        "items": [{"menu_item_id": menu_item.id, "quantity": 2}],
        "scheduled_pickup_time": (datetime.utcnow() + timedelta(minutes=20)).isoformat(),
        "payment_method": "campus_card",
        "customer_notes": "Extra crispy toast"
    }

    response = client.post("/api/orders", json=order_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["order_number"].startswith("CB-")
    assert "verification_code" in data

    # Verify ingredient reservation in DB
    bread = db_session.query(Ingredient).filter(Ingredient.name == "Test Bread").first()
    cheese = db_session.query(Ingredient).filter(Ingredient.name == "Test Cheese").first()
    assert bread.reserved_stock == 4.0
    assert bread.available_stock == 6.0
    assert cheese.reserved_stock == 2.0
    assert cheese.available_stock == 3.0

def test_insufficient_stock_rejection(client, db_session):
    headers = get_auth_header(client)
    menu_item = db_session.query(MenuItem).filter(MenuItem.name == "Test Sandwich").first()

    # Try to order 10 sandwiches (needs 20 bread, but only 10 in stock)
    order_payload = {
        "items": [{"menu_item_id": menu_item.id, "quantity": 10}],
        "scheduled_pickup_time": (datetime.utcnow() + timedelta(minutes=20)).isoformat(),
        "payment_method": "campus_card"
    }

    response = client.post("/api/orders", json=order_payload, headers=headers)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]

def test_cancellation_releases_reservation(client, db_session):
    headers = get_auth_header(client)
    menu_item = db_session.query(MenuItem).filter(MenuItem.name == "Test Sandwich").first()

    # Order 1 sandwich (2 bread, 1 cheese)
    order_payload = {
        "items": [{"menu_item_id": menu_item.id, "quantity": 1}],
        "scheduled_pickup_time": (datetime.utcnow() + timedelta(minutes=20)).isoformat(),
        "payment_method": "campus_card"
    }
    create_res = client.post("/api/orders", json=order_payload, headers=headers)
    order_id = create_res.json()["id"]

    # Cancel the order
    cancel_res = client.patch(
        f"/api/orders/{order_id}/status", 
        json={"status": "cancelled", "cancellation_reason": "Change of schedule"},
        headers=headers
    )
    assert cancel_res.status_code == 200

    # Ensure reservation was released back to available stock
    bread = db_session.query(Ingredient).filter(Ingredient.name == "Test Bread").first()
    assert bread.reserved_stock == 0.0
    assert bread.available_stock == bread.current_stock
