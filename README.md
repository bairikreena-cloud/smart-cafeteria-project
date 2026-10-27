# Smart Cafeteria Pre-Order & Inventory Management System

A production-grade, full-stack college Problem-Based Learning (PBL) web application designed for university dining halls. It provides real-time student pre-ordering, kitchen queue expediting, atomic recipe-based ingredient inventory tracking, and role-based administration.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Vite, Tailwind CSS, Lucide Icons, WebSocket Client) │
└─────────────┬────────────────────────────▲─────────────┘
              │ REST APIs                  │ WebSockets
              ▼                            │ (Live Push)
┌──────────────────────────────────────────┴─────────────┐
│                 Python FastAPI Backend                 │
│      (Pydantic v2, JWT Security, Bcrypt, Pytest)       │
├────────────────────────────────────────────────────────┤
│             Atomic Inventory Engine                    │
│   Formula: required_i = sum(recipe_i * quantity)       │
│   Atomic Check: available_i = current_i - reserved_i   │
│   PostgreSQL Row Locking: SELECT ... FOR UPDATE        │
└─────────────┬──────────────────────────────────────────┘
              ▼
┌────────────────────────────────────────────────────────┐
│               PostgreSQL Relational Database           │
│     (13 Normalized Tables, Constraints, Indexes)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Relational Database Schema (13 Normalized Tables)

1. **`roles`**: System permission tiers (`customer`, `kitchen_staff`, `admin`).
2. **`users`**: Customer and staff profiles, hashed credentials, phone, student IDs.
3. **`ingredients`**: Stock levels, units (`slices`, `grams`, `ml`), minimum reorder thresholds, expiry dates, supplier information.
4. **`menu_items`**: Dish catalog, categories, prices, prep times, allergen tags, manual availability switches.
5. **`recipes`**: Recipes linking each menu dish to required ingredients.
6. **`recipe_ingredients`**: Normalized pivot specifying exact quantity of each ingredient needed per 1 serving (Unique constraint on `recipe_id` + `ingredient_id`).
7. **`orders`**: Order number (`CB-2026-XXXX`), status pipeline, scheduled and actual pickup timestamps, totals, taxes, customer notes.
8. **`order_items`**: Items ordered, portion counts, unit prices, subtotals.
9. **`payments`**: Transparent mock payment records (`campus_card`, `upi`, `cash_counter`, `card`), status, transaction references.
10. **`pickup_verifications`**: Unique 4-digit pickup verification code (`e.g. 7482`), verification status, verified by staff ID, verification timestamp.
11. **`inventory_reservations`**: Temporary holds placed during order submission (`held`, `consumed`, `released`).
12. **`inventory_transactions`**: Complete audit ledger recording every inventory modification (`order_reservation`, `order_consumption`, `order_cancellation_restore`, `purchase`, `waste_spoilage`).
13. **`notifications`**: User alerts for order stage transitions, low-stock warnings, and delay alerts.

---

## 3. Project Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py              # PostgreSQL & SQLite session engine
│   │   ├── models.py                # 13 SQLAlchemy database models
│   │   ├── schemas.py               # Pydantic v2 validation schemas
│   │   ├── auth.py                  # JWT encoding & bcrypt password hashing
│   │   ├── main.py                  # FastAPI app entry point & WebSockets
│   │   ├── services/
│   │   │   ├── inventory_service.py # Atomic reservations & portion calculator
│   │   │   └── websocket_manager.py # Multi-client live broadcaster
│   │   └── routers/
│   │       ├── auth.py              # Register, login, profile
│   │       ├── menu.py              # Menu retrieval & dish admin
│   │       ├── orders.py            # Order placement & status lifecycle
│   │       ├── inventory.py         # Stock intake, adjustments, audit
│   │       ├── verification.py      # 4-digit counter handover verification
│   │       └── reports.py           # Sales summary & CSV download endpoints
│   ├── tests/
│   │   ├── conftest.py              # In-memory SQLite test fixtures
│   │   ├── test_auth.py             # Auth & permission test cases
│   │   ├── test_inventory.py        # Stock calculation & expiry test cases
│   │   └── test_orders.py           # Concurrency & order placement tests
│   ├── requirements.txt             # Python backend dependencies
│   ├── pytest.ini                   # Pytest test runner configuration
│   ├── seed_data.py                 # Realistic sample food & inventory seed script
│   └── .env.example                 # Environment variables template
├── src/
│   ├── components/
│   │   ├── Navbar.tsx               # Header, role switcher, WebSocket indicator
│   │   ├── Footer.tsx               # Cafeteria hours & campus locations
│   │   ├── customer/
│   │   │   ├── MenuCatalog.tsx      # Dish cards, search & dietary filters
│   │   │   ├── ItemDetailModal.tsx  # Recipe ingredient breakdown & allergens
│   │   │   ├── CartDrawer.tsx       # Pre-order cart & time-slot picker
│   │   │   ├── CheckoutModal.tsx    # Mock payment authorization
│   │   │   ├── OrderConfirmationModal.tsx # 4-digit pickup code display
│   │   │   ├── LiveOrderTracker.tsx # Real-time 5-stage progress bar
│   │   │   └── OrderHistoryModal.tsx # Past receipts & order records
│   │   ├── staff/
│   │   │   ├── KitchenOrdersBoard.tsx # Kanban order expediting board
│   │   │   └── PickupVerificationModal.tsx # Counter code validator
│   │   ├── admin/
│   │   │   ├── InventoryManager.tsx # Ingredient stock & reorder thresholds
│   │   │   ├── InventoryAuditLogModal.tsx # Full immutable transaction log
│   │   │   ├── MenuManager.tsx      # Recipe spec & dish editor
│   │   │   └── ReportsAnalytics.tsx # Sales KPIs & CSV exports
│   │   └── pbl/
│   │       ├── ConcurrencyTestModal.tsx # Live atomic locking simulator
│   │       └── ProjectDocumentationModal.tsx # Interactive presentation hub
│   ├── context/
│   │   ├── AuthContext.tsx          # Multi-role customer/staff state
│   │   ├── CartContext.tsx          # Cart & stock portion validation
│   │   └── NotificationContext.tsx  # WebSocket live push notifications
│   ├── data/
│   │   └── mockDatabase.ts          # Authentic seed ingredients & recipes
│   ├── services/
│   │   └── storageEngine.ts         # Persistent client database & WS event bus
│   ├── types/
│   │   └── index.ts                 # TypeScript data contracts
│   ├── App.tsx                      # Main application container
│   └── main.tsx                     # React DOM entry point
├── package.json
└── README.md
```

---

## 4. Local Installation & Execution on Windows (VS Code)

### Prerequisites
1. **Node.js** (v18 or higher)
2. **Python** (v3.10 or higher)
3. **PostgreSQL** (v14 or higher) or SQLite

### Step 1: Clone Repository
```powershell
git clone <repository-url>
cd smart-cafeteria
code .
```

### Step 2: Set Up Python Backend
Open a PowerShell terminal in VS Code:
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Configure Database & Seed Data
```powershell
# In PostgreSQL (via psql or pgAdmin):
# CREATE DATABASE smart_cafeteria;

# Run sample database seed script:
python backend/seed_data.py
```

### Step 4: Run Automated Tests
```powershell
pytest backend/tests
```

### Step 5: Start FastAPI Backend Server
```powershell
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### Step 6: Start React Frontend
In a separate VS Code terminal:
```powershell
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 5. End-to-End Evaluation Demonstration Scenario

1. **Browse Food Menu & Inspect Recipe**:
   - Log in as Student **Alex Chen**.
   - Filter by *Vegetarian* or *Gluten-Free*.
   - Click "Recipe & Stock" on the *Artisan Triple Cheddar Toastie* to observe the exact ingredients required (2 sourdough slices, 2 cheese portions).
2. **Pre-Order Placement & Atomic Hold**:
   - Add items to the cart and pick a scheduled pickup time.
   - Choose Campus Card (mock payment) and submit.
   - Notice the generated Order ID (`CB-2026-XXXX`) and 4-digit verification code (`7491`).
   - Ingredients are atomically reserved; physical pantry stock remains protected from overselling.
3. **Kitchen Expediting (Role Switch: Chef Mario)**:
   - Click the role pill in the top navbar and switch to **Chef Mario Rossi**.
   - The kitchen board rings with the new incoming order.
   - Click "Accept Order", then "Start Cooking" (which automatically consumes the hold and permanently deducts physical stock).
   - Click "Mark Ready at Counter B".
4. **Counter Handover & Verification**:
   - Student receives an instant ready alert.
   - Counter staff clicks "Verify Code & Handover" and enters the student's 4-digit code.
   - Handover is authorized and order transitions to `COLLECTED`.
5. **Administrative Inventory & Sales Analytics (Role Switch: Elena Vance)**:
   - Switch to **Elena Vance (Manager)**.
   - Inspect ingredient stocks, adjust inventory with mandatory audit reasons, view the audit ledger, and click "Export Sales (CSV)" to download real spreadsheet reports.
6. **Live Concurrency Stress Test**:
   - Click "⚡ Test Atomic Concurrency" in the top bar to simulate 5 concurrent students competing for limited portions, verifying race-condition protection.
