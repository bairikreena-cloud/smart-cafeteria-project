import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Role, User, Ingredient, MenuItem, Recipe, RecipeIngredient
from app.auth import get_password_hash

# Use in-memory SQLite for blazing fast automated test execution
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed core roles
    cust_role = Role(name="customer", description="Customer")
    staff_role = Role(name="kitchen_staff", description="Staff")
    admin_role = Role(name="admin", description="Admin")
    session.add_all([cust_role, staff_role, admin_role])
    session.flush()

    # Seed a test customer
    cust_user = User(
        full_name="Test Student",
        email="student@campus.edu",
        hashed_password=get_password_hash("testpass123"),
        role_id=cust_role.id,
        is_active=True
    )
    # Seed a staff user
    staff_user = User(
        full_name="Test Chef",
        email="chef@campus.edu",
        hashed_password=get_password_hash("testpass123"),
        role_id=staff_role.id,
        is_active=True
    )
    session.add_all([cust_user, staff_user])
    session.flush()

    # Seed test ingredients
    bread = Ingredient(
        name="Test Bread",
        category="Bakery",
        unit="slices",
        current_stock=10.0,
        reserved_stock=0.0,
        minimum_threshold=4.0
    )
    cheese = Ingredient(
        name="Test Cheese",
        category="Dairy",
        unit="slices",
        current_stock=5.0,
        reserved_stock=0.0,
        minimum_threshold=2.0
    )
    session.add_all([bread, cheese])
    session.flush()

    # Seed test menu item & recipe (Requires 2 slices bread, 1 slice cheese)
    sandwich = MenuItem(
        name="Test Sandwich",
        description="A simple test sandwich",
        category="Sandwiches",
        price=5.00,
        is_manually_available=True
    )
    session.add(sandwich)
    session.flush()

    recipe = Recipe(menu_item_id=sandwich.id, name="Test Sandwich Recipe")
    session.add(recipe)
    session.flush()

    ri1 = RecipeIngredient(recipe_id=recipe.id, ingredient_id=bread.id, quantity_required=2.0)
    ri2 = RecipeIngredient(recipe_id=recipe.id, ingredient_id=cheese.id, quantity_required=1.0)
    session.add_all([ri1, ri2])

    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
