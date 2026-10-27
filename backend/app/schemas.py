from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from .models import OrderStatus, PaymentMethod, PaymentStatus, InventoryTxType

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    student_staff_id: Optional[str] = None
    phone_number: Optional[str] = None

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    role_name: str = "customer" # "customer", "kitchen_staff", "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Ingredient & Recipe Schemas ---
class IngredientBase(BaseModel):
    name: str
    category: str
    unit: str
    current_stock: float
    minimum_threshold: float = 10.0
    cost_per_unit: float = 0.0
    expiry_date: Optional[datetime] = None
    supplier_info: Optional[str] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    minimum_threshold: Optional[float] = None
    cost_per_unit: Optional[float] = None
    expiry_date: Optional[datetime] = None
    supplier_info: Optional[str] = None

class IngredientResponse(IngredientBase):
    id: int
    reserved_stock: float
    available_stock: float
    last_updated: datetime

    class Config:
        from_attributes = True

class RecipeIngredientRequirement(BaseModel):
    ingredient_id: int
    quantity_required: float

class RecipeIngredientDetail(BaseModel):
    ingredient_id: int
    ingredient_name: str
    quantity_required: float
    unit: str
    available_stock: float

class MenuItemBase(BaseModel):
    name: str
    description: str
    category: str
    price: float
    image_url: Optional[str] = None
    prep_time_minutes: int = 10
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    allergens: Optional[str] = None
    is_manually_available: bool = True

class MenuItemCreate(MenuItemBase):
    ingredients: List[RecipeIngredientRequirement] = []

class MenuItemResponse(MenuItemBase):
    id: int
    available_portions: int # dynamically computed from ingredient inventory!
    is_in_stock: bool
    recipe_ingredients: List[RecipeIngredientDetail] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Order & Cart Schemas ---
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    scheduled_pickup_time: datetime
    payment_method: PaymentMethod = PaymentMethod.CAMPUS_CARD
    customer_notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: str
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: str
    status: OrderStatus
    scheduled_pickup_time: datetime
    actual_pickup_time: Optional[datetime] = None
    total_amount: float
    tax_amount: float
    customer_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]
    verification_code: Optional[str] = None # Returned to order owner or staff
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    cancellation_reason: Optional[str] = None

class PickupVerificationRequest(BaseModel):
    order_id: int
    verification_code: str

# --- Inventory Adjustments & Audit Schemas ---
class StockAdjustmentRequest(BaseModel):
    ingredient_id: int
    quantity_change: float # Positive for restock, negative for deduction/waste
    transaction_type: InventoryTxType
    reason: str

class InventoryTransactionResponse(BaseModel):
    id: int
    ingredient_id: int
    ingredient_name: str
    order_id: Optional[int]
    transaction_type: InventoryTxType
    quantity_change: float
    balance_after: float
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

class LowStockAlert(BaseModel):
    ingredient_id: int
    name: str
    current_stock: float
    minimum_threshold: float
    unit: str
    severity: str # "CRITICAL" | "WARNING"

class DailySalesSummary(BaseModel):
    date: str
    total_orders: int
    total_revenue: float
    completed_orders: int
    cancelled_orders: int

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_order_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
