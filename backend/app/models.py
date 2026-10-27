import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, 
    ForeignKey, Text, Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    KITCHEN_STAFF = "kitchen_staff"
    ADMIN = "admin"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    COLLECTED = "collected"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

class PaymentMethod(str, enum.Enum):
    CAMPUS_CARD = "campus_card"
    UPI = "upi"
    CASH_COUNTER = "cash_counter"
    CARD = "card"

class InventoryTxType(str, enum.Enum):
    PURCHASE = "purchase"
    ADJUSTMENT = "adjustment"
    ORDER_RESERVATION = "order_reservation"
    ORDER_CONSUMPTION = "order_consumption"
    ORDER_CANCELLATION_RESTORE = "order_cancellation_restore"
    WASTE_SPOILAGE = "waste_spoilage"

class ReservationStatus(str, enum.Enum):
    HELD = "held"
    CONSUMED = "consumed"
    RELEASED = "released"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=1)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    student_staff_id = Column(String(50), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="customer")
    notifications = relationship("Notification", back_populates="user")

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False) # Produce, Dairy, Bakery, Protein, Beverage, Pantry
    unit = Column(String(20), nullable=False) # slices, grams, ml, portions, units
    current_stock = Column(Float, nullable=False, default=0.0)
    reserved_stock = Column(Float, nullable=False, default=0.0)
    minimum_threshold = Column(Float, nullable=False, default=10.0)
    cost_per_unit = Column(Float, nullable=False, default=0.0)
    expiry_date = Column(DateTime, nullable=True)
    supplier_info = Column(String(200), nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recipe_items = relationship("RecipeIngredient", back_populates="ingredient")
    transactions = relationship("InventoryTransaction", back_populates="ingredient")
    reservations = relationship("InventoryReservation", back_populates="ingredient")

    @property
    def available_stock(self) -> float:
        """Physical stock minus any temporarily reserved portions."""
        return max(0.0, self.current_stock - self.reserved_stock)

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True) # Sandwiches, Bowls, Beverages, Bakery, Specials
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    prep_time_minutes = Column(Integer, default=10)
    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    allergens = Column(String(255), nullable=True) # e.g. "Dairy, Gluten, Soy"
    is_manually_available = Column(Boolean, default=True) # Staff override
    created_at = Column(DateTime, default=datetime.utcnow)

    recipe = relationship("Recipe", back_populates="menu_item", uselist=False, cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    instructions = Column(Text, nullable=True)
    serving_size = Column(String(50), default="1 portion")

    menu_item = relationship("MenuItem", back_populates="recipe")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_required = Column(Float, nullable=False) # e.g. 2 slices bread, 30g cheese

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_items")

    __table_args__ = (
        UniqueConstraint("recipe_id", "ingredient_id", name="uq_recipe_ingredient"),
    )

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. CB-2026-9812
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    scheduled_pickup_time = Column(DateTime, nullable=False)
    actual_pickup_time = Column(DateTime, nullable=True)
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False, default=0.0)
    customer_notes = Column(String(255), nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    verification = relationship("PickupVerification", back_populates="order", uselist=False, cascade="all, delete-orphan")
    reservations = relationship("InventoryReservation", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    transaction_reference = Column(String(100), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    is_mock = Column(Boolean, default=True) # Always transparently noted
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment")

class PickupVerification(Base):
    __tablename__ = "pickup_verifications"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    verification_code = Column(String(6), nullable=False, index=True) # e.g. "8492"
    is_verified = Column(Boolean, default=False)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="verification")

class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_reserved = Column(Float, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.HELD, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="reservations")
    ingredient = relationship("Ingredient", back_populates="reservations")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    transaction_type = Column(Enum(InventoryTxType), nullable=False)
    quantity_change = Column(Float, nullable=False) # Negative for deduction, positive for purchase
    balance_after = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    ingredient = relationship("Ingredient", back_populates="transactions")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="order_update") # order_update, low_stock, delay_alert
    is_read = Column(Boolean, default=False)
    related_order_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")
