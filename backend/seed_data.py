import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    Role, User, Ingredient, MenuItem, Recipe, RecipeIngredient, 
    InventoryTransaction, InventoryTxType
)
from app.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Roles
        roles_data = [
            ("customer", "Student / Faculty Customer ordering food"),
            ("kitchen_staff", "Cafeteria chef & prep staff managing orders"),
            ("admin", "Cafeteria Operations Manager & Inventory Supervisor")
        ]
        roles_dict = {}
        for role_name, desc in roles_data:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=desc)
                db.add(role)
                db.flush()
            roles_dict[role_name] = role

        # 2. Seed Users
        users_data = [
            ("Alex Chen (Student)", "alex.student@campus.edu", "STU-2024-883", "student123", "customer"),
            ("Chef Mario Rossi", "chef.mario@campus.edu", "STF-KITCHEN-01", "kitchen123", "kitchen_staff"),
            ("Elena Vance (Manager)", "admin@campus.edu", "MGR-001", "admin123", "admin")
        ]
        for name, email, sid, pwd, r_name in users_data:
            if not db.query(User).filter(User.email == email).first():
                user = User(
                    full_name=name,
                    email=email,
                    student_staff_id=sid,
                    hashed_password=get_password_hash(pwd),
                    role_id=roles_dict[r_name].id,
                    is_active=True
                )
                db.add(user)

        db.flush()

        # 3. Seed Realistic Ingredients
        now = datetime.utcnow()
        ingredients_seed = [
            # Name, category, unit, stock, min_thresh, cost, days_until_expiry, supplier
            ("Artisan Sourdough Bread", "Bakery", "slices", 80.0, 20.0, 0.40, 5, "Campus Bakery Co."),
            ("Aged Cheddar Cheese", "Dairy", "slices", 60.0, 15.0, 0.50, 14, "Valley Dairy Farms"),
            ("Seasoned Chicken Breast", "Protein", "portions", 35.0, 10.0, 2.20, 4, "GreenPastures Poultry"),
            ("Roma Tomatoes", "Produce", "units", 50.0, 12.0, 0.35, 6, "Local Organic Harvest"),
            ("Crisp Romaine Lettuce", "Produce", "leaves", 100.0, 25.0, 0.15, 5, "Local Organic Harvest"),
            ("Herbed Garlic Mayo", "Pantry", "portions", 75.0, 20.0, 0.25, 30, "Condiments Direct"),
            ("Whole Wheat Tortilla", "Bakery", "units", 40.0, 12.0, 0.45, 10, "Metro Foods"),
            ("Fresh Hass Avocado", "Produce", "units", 30.0, 8.0, 1.10, 4, "Sunshine Fruit Imports"),
            ("Farm Fresh Eggs", "Protein", "units", 60.0, 15.0, 0.30, 18, "Valley Farm Fresh"),
            ("Greek Strained Yogurt", "Dairy", "grams", 2500.0, 500.0, 0.012, 12, "Alpine Dairy"),
            ("Mixed Forest Berries", "Produce", "grams", 1500.0, 300.0, 0.025, 4, "Berry Fields Organics"),
            ("House Roasted Granola", "Bakery", "grams", 2000.0, 400.0, 0.015, 45, "In-House Prep"),
            ("Cold Brew Concentrate", "Beverage", "ml", 5000.0, 1000.0, 0.02, 20, "Artisan Coffee Roasters"),
            ("Barista Oat Milk", "Dairy", "ml", 8000.0, 1500.0, 0.005, 25, "OatStream Labs"),
            ("Vanilla Bean Syrup", "Beverage", "ml", 1500.0, 300.0, 0.018, 90, "FlavorCraft"),
            ("Organic Tricolor Quinoa", "Pantry", "grams", 3000.0, 600.0, 0.01, 120, "Global Grains")
        ]

        ing_map = {}
        for name, cat, unit, stock, min_t, cost, days_exp, sup in ingredients_seed:
            ing = db.query(Ingredient).filter(Ingredient.name == name).first()
            if not ing:
                ing = Ingredient(
                    name=name,
                    category=cat,
                    unit=unit,
                    current_stock=stock,
                    reserved_stock=0.0,
                    minimum_threshold=min_t,
                    cost_per_unit=cost,
                    expiry_date=now + timedelta(days=days_exp),
                    supplier_info=sup
                )
                db.add(ing)
                db.flush()
                # Audit transaction
                audit = InventoryTransaction(
                    ingredient_id=ing.id,
                    transaction_type=InventoryTxType.PURCHASE,
                    quantity_change=stock,
                    balance_after=stock,
                    reason=f"Initial seed delivery from {sup}"
                )
                db.add(audit)
            ing_map[name] = ing

        # 4. Seed Menu Items & Recipes
        menu_items_seed = [
            {
                "name": "Artisan Triple Cheddar Toastie",
                "desc": "Golden toasted sourdough loaded with melted aged cheddar, herbed garlic glaze, and fresh cracked pepper.",
                "category": "Sandwiches & Wraps",
                "price": 6.75,
                "prep_time": 8,
                "is_veg": True,
                "is_vegan": False,
                "is_gf": False,
                "allergens": "Dairy, Gluten",
                "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Artisan Sourdough Bread", 2.0),
                    ("Aged Cheddar Cheese", 2.0),
                    ("Herbed Garlic Mayo", 1.0)
                ]
            },
            {
                "name": "Chipotle Chicken & Avocado Wrap",
                "desc": "Grilled chicken breast, freshly sliced avocado, crisp romaine lettuce, Roma tomatoes, wrapped in whole wheat.",
                "category": "Sandwiches & Wraps",
                "price": 8.50,
                "prep_time": 10,
                "is_veg": False,
                "is_vegan": False,
                "is_gf": False,
                "allergens": "Gluten",
                "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Whole Wheat Tortilla", 1.0),
                    ("Seasoned Chicken Breast", 1.0),
                    ("Fresh Hass Avocado", 0.5),
                    ("Roma Tomatoes", 1.0),
                    ("Crisp Romaine Lettuce", 3.0)
                ]
            },
            {
                "name": "Greek Yogurt & Wild Berry Granola Bowl",
                "desc": "Rich creamy Greek strained yogurt layered with forest berries, house-baked honey cinnamon granola, and flax.",
                "category": "Bowls & Breakfast",
                "price": 5.95,
                "prep_time": 5,
                "is_veg": True,
                "is_vegan": False,
                "is_gf": True,
                "allergens": "Dairy, Honey",
                "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Greek Strained Yogurt", 150.0),
                    ("Mixed Forest Berries", 60.0),
                    ("House Roasted Granola", 40.0)
                ]
            },
            {
                "name": "Avocado & Poached Egg Power Plate",
                "desc": "Two farm eggs served over toasted sourdough with smashed Hass avocado, microgreens, and chili flakes.",
                "category": "Bowls & Breakfast",
                "price": 7.80,
                "prep_time": 12,
                "is_veg": True,
                "is_vegan": False,
                "is_gf": False,
                "allergens": "Eggs, Gluten",
                "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Farm Fresh Eggs", 2.0),
                    ("Artisan Sourdough Bread", 2.0),
                    ("Fresh Hass Avocado", 1.0),
                    ("Roma Tomatoes", 1.0)
                ]
            },
            {
                "name": "Cold Brew Vanilla Oat Cloud Latte",
                "desc": "Slow-steeped cold brew coffee charged with creamy barista oat milk and pure Madagascar vanilla bean syrup.",
                "category": "Beverages",
                "price": 4.85,
                "prep_time": 4,
                "is_veg": True,
                "is_vegan": True,
                "is_gf": True,
                "allergens": "Oats",
                "image": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Cold Brew Concentrate", 120.0),
                    ("Barista Oat Milk", 180.0),
                    ("Vanilla Bean Syrup", 25.0)
                ]
            },
            {
                "name": "Garden Harvest Mediterranean Quinoa Bowl",
                "desc": "Tricolor fluffy quinoa topped with diced Roma tomatoes, crisp greens, sliced avocado, and lemon vinaigrette.",
                "category": "Bowls & Breakfast",
                "price": 7.50,
                "prep_time": 7,
                "is_veg": True,
                "is_vegan": True,
                "is_gf": True,
                "allergens": "None",
                "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
                "recipe": [
                    ("Organic Tricolor Quinoa", 120.0),
                    ("Crisp Romaine Lettuce", 4.0),
                    ("Roma Tomatoes", 1.0),
                    ("Fresh Hass Avocado", 0.5)
                ]
            }
        ]

        for item_data in menu_items_seed:
            menu_item = db.query(MenuItem).filter(MenuItem.name == item_data["name"]).first()
            if not menu_item:
                menu_item = MenuItem(
                    name=item_data["name"],
                    description=item_data["desc"],
                    category=item_data["category"],
                    price=item_data["price"],
                    prep_time_minutes=item_data["prep_time"],
                    is_vegetarian=item_data["is_veg"],
                    is_vegan=item_data["is_vegan"],
                    is_gluten_free=item_data["is_gf"],
                    allergens=item_data["allergens"],
                    image_url=item_data["image"],
                    is_manually_available=True
                )
                db.add(menu_item)
                db.flush()

                recipe = Recipe(
                    menu_item_id=menu_item.id,
                    name=f"Standard Spec for {menu_item.name}",
                    serving_size="1 order"
                )
                db.add(recipe)
                db.flush()

                for ing_name, qty_req in item_data["recipe"]:
                    if ing_name in ing_map:
                        ri = RecipeIngredient(
                            recipe_id=recipe.id,
                            ingredient_id=ing_map[ing_name].id,
                            quantity_required=qty_req
                        )
                        db.add(ri)

        db.commit()
        print("Database successfully seeded with realistic Smart Cafeteria data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
