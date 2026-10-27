from app.models import Ingredient, MenuItem, Recipe, RecipeIngredient
from app.services.inventory_service import InventoryService
from datetime import datetime, timedelta

def test_menu_portion_calculation(db_session):
    # Sandwich requires 2 bread, 1 cheese.
    # Current stock: Bread=10, Cheese=5.
    # Available portions should be min(10/2, 5/1) = 5.
    menu_item = db_session.query(MenuItem).filter(MenuItem.name == "Test Sandwich").first()
    portions = InventoryService.calculate_menu_item_availability(db_session, menu_item.id)
    assert portions == 5

    # If cheese drops to 2: portions should become min(10/2, 2/1) = 2
    cheese = db_session.query(Ingredient).filter(Ingredient.name == "Test Cheese").first()
    cheese.current_stock = 2.0
    db_session.commit()

    portions = InventoryService.calculate_menu_item_availability(db_session, menu_item.id)
    assert portions == 2

def test_expired_ingredient_zeroes_availability(db_session):
    menu_item = db_session.query(MenuItem).filter(MenuItem.name == "Test Sandwich").first()
    bread = db_session.query(Ingredient).filter(Ingredient.name == "Test Bread").first()
    bread.expiry_date = datetime.utcnow() - timedelta(days=1)
    db_session.commit()

    portions = InventoryService.calculate_menu_item_availability(db_session, menu_item.id)
    assert portions == 0
