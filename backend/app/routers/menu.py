from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MenuItem, Recipe, RecipeIngredient, Ingredient, User
from ..schemas import MenuItemCreate, MenuItemResponse, RecipeIngredientDetail
from ..services.inventory_service import InventoryService
from ..auth import get_admin_user

router = APIRouter(prefix="/api/menu", tags=["Menu Management"])

@router.get("", response_model=List[MenuItemResponse])
def get_menu_items(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_vegetarian: Optional[bool] = Query(None),
    is_vegan: Optional[bool] = Query(None),
    is_gluten_free: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MenuItem)

    if category and category.lower() != "all":
        query = query.filter(MenuItem.category.ilike(category))
    if is_vegetarian:
        query = query.filter(MenuItem.is_vegetarian == True)
    if is_vegan:
        query = query.filter(MenuItem.is_vegan == True)
    if is_gluten_free:
        query = query.filter(MenuItem.is_gluten_free == True)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (MenuItem.name.ilike(search_filter)) | 
            (MenuItem.description.ilike(search_filter))
        )

    items = query.all()
    results = []

    for item in items:
        # Dynamically calculate portions based on ingredient stock
        available_portions = InventoryService.calculate_menu_item_availability(db, item.id)
        is_in_stock = (available_portions > 0) and item.is_manually_available

        # Gather recipe details
        recipe_details = []
        if item.recipe:
            for ri in item.recipe.ingredients:
                ing = ri.ingredient
                if ing:
                    recipe_details.append(RecipeIngredientDetail(
                        ingredient_id=ing.id,
                        ingredient_name=ing.name,
                        quantity_required=ri.quantity_required,
                        unit=ing.unit,
                        available_stock=ing.available_stock
                    ))

        results.append(MenuItemResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            category=item.category,
            price=item.price,
            image_url=item.image_url,
            prep_time_minutes=item.prep_time_minutes,
            is_vegetarian=item.is_vegetarian,
            is_vegan=item.is_vegan,
            is_gluten_free=item.is_gluten_free,
            allergens=item.allergens,
            is_manually_available=item.is_manually_available,
            available_portions=available_portions,
            is_in_stock=is_in_stock,
            recipe_ingredients=recipe_details,
            created_at=item.created_at
        ))

    return results

@router.get("/{item_id}", response_model=MenuItemResponse)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    available_portions = InventoryService.calculate_menu_item_availability(db, item.id)
    recipe_details = []
    if item.recipe:
        for ri in item.recipe.ingredients:
            ing = ri.ingredient
            if ing:
                recipe_details.append(RecipeIngredientDetail(
                    ingredient_id=ing.id,
                    ingredient_name=ing.name,
                    quantity_required=ri.quantity_required,
                    unit=ing.unit,
                    available_stock=ing.available_stock
                ))

    return MenuItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        category=item.category,
        price=item.price,
        image_url=item.image_url,
        prep_time_minutes=item.prep_time_minutes,
        is_vegetarian=item.is_vegetarian,
        is_vegan=item.is_vegan,
        is_gluten_free=item.is_gluten_free,
        allergens=item.allergens,
        is_manually_available=item.is_manually_available,
        available_portions=available_portions,
        is_in_stock=(available_portions > 0) and item.is_manually_available,
        recipe_ingredients=recipe_details,
        created_at=item.created_at
    )

@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item_in: MenuItemCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    menu_item = MenuItem(
        name=item_in.name,
        description=item_in.description,
        category=item_in.category,
        price=item_in.price,
        image_url=item_in.image_url,
        prep_time_minutes=item_in.prep_time_minutes,
        is_vegetarian=item_in.is_vegetarian,
        is_vegan=item_in.is_vegan,
        is_gluten_free=item_in.is_gluten_free,
        allergens=item_in.allergens,
        is_manually_available=item_in.is_manually_available
    )
    db.add(menu_item)
    db.flush()

    # Create associated Recipe
    recipe = Recipe(
        menu_item_id=menu_item.id,
        name=f"Standard Recipe for {menu_item.name}",
        serving_size="1 portion"
    )
    db.add(recipe)
    db.flush()

    for ing_req in item_in.ingredients:
        ri = RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_req.ingredient_id,
            quantity_required=ing_req.quantity_required
        )
        db.add(ri)

    db.commit()
    db.refresh(menu_item)

    return get_menu_item(menu_item.id, db)

@router.patch("/{item_id}/availability")
def toggle_availability(
    item_id: int, 
    is_available: bool, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item.is_manually_available = is_available
    db.commit()
    return {"message": "Availability updated", "item_id": item_id, "is_available": is_available}
