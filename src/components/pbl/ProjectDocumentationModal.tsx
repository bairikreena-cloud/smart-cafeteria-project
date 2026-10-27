import React, { useState } from 'react';
import { 
  X, BookOpen, Database, Server, Terminal, 
  Workflow, CheckCircle2, ShieldCheck, Copy, Check 
} from 'lucide-react';

interface ProjectDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDocumentationModal: React.FC<ProjectDocumentationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'setup' | 'demo_script'>('architecture');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                Smart Cafeteria PBL Project & Engineering Manual
              </h3>
              <p className="text-[11px] text-stone-400">
                System Architecture, 13-Table Normalized Relational Schema, and Windows Setup Guide
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-5 gap-2 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>1. System Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Relational Database (13 Tables)</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Local VS Code & Windows Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('demo_script')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'demo_script'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>4. End-to-End Demo Script</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          
          {/* TAB 1: SYSTEM ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Full-Stack Modular Architecture</span>
                </h4>
                <p className="text-emerald-800 leading-relaxed text-xs">
                  The system is designed with a strict separation of concerns, ensuring high scalability, real-time synchronization, and atomic transaction guarantees:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                  <div className="font-extrabold text-stone-900 text-xs uppercase tracking-wider text-emerald-700">
                    Frontend Layer
                  </div>
                  <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                    <li>React 19 SPA with Vite</li>
                    <li>Tailwind CSS & Lucide Icons</li>
                    <li>Role-Based Navigation Views</li>
                    <li>WebSocket Client with Auto-Reconnect</li>
                    <li>Persistent Client State & Sync</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                  <div className="font-extrabold text-stone-900 text-xs uppercase tracking-wider text-blue-700">
                    Backend API & Real-Time
                  </div>
                  <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                    <li>Python 3.10+ with FastAPI</li>
                    <li>SQLAlchemy 2.0 ORM</li>
                    <li>WebSockets ConnectionManager</li>
                    <li>JWT Authentication + Bcrypt Hashing</li>
                    <li>Pydantic v2 Request/Response Schemas</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                  <div className="font-extrabold text-stone-900 text-xs uppercase tracking-wider text-purple-700">
                    Database & Inventory
                  </div>
                  <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                    <li>PostgreSQL with Connection Pooling</li>
                    <li>Row-Level Locks (<code>FOR UPDATE</code>)</li>
                    <li>Atomic Recipe-to-Ingredient Reservations</li>
                    <li>Full Audit Ledger & Transactions</li>
                    <li>Alembic Migrations & Pytest Suite</li>
                  </ul>
                </div>

              </div>

              {/* Data Flow Diagram */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white font-mono text-[11px] space-y-2">
                <div className="text-stone-400 font-bold uppercase text-[10px]">Real-Time Data Flow:</div>
                <div className="p-3 bg-black/50 rounded-xl space-y-1 leading-relaxed text-stone-300">
                  <div>1. Student places Pre-Order ➔ <code>POST /api/orders</code></div>
                  <div>2. Backend begins DB Transaction: row-locks required ingredients via <code>SELECT ... FOR UPDATE</code></div>
                  <div>3. Formula evaluated: <code>required = sum(recipe_qty * order_qty)</code>. Check <code>available &gt;= required</code></div>
                  <div>4. If valid: Increment <code>reserved_stock</code>, generate Order ID + 4-digit code, commit txn</div>
                  <div>5. WebSocket dispatches <code>NEW_ORDER</code> broadcast to Kitchen Staff screens instantly</div>
                  <div>6. Chef prepares order: Stock deducted from <code>current_stock</code>, hold released</div>
                  <div>7. Counter verifies 4-digit code: Order status transitions to <code>COLLECTED</code></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RELATIONAL DATABASE SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-100 rounded-xl text-stone-700 font-medium">
                Normalized PostgreSQL relational schema consisting of 13 interconnected entities:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">1. users</div>
                  <div className="text-stone-500">PK: id | FK: role_id | full_name, email, password_hash, student_staff_id, is_active</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">2. roles</div>
                  <div className="text-stone-500">PK: id | name ('customer', 'kitchen_staff', 'admin'), description</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">3. ingredients</div>
                  <div className="text-stone-500">PK: id | name, category, unit, current_stock, reserved_stock, minimum_threshold, expiry_date</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">4. menu_items</div>
                  <div className="text-stone-500">PK: id | name, description, category, price, prep_time_minutes, is_manually_available, allergens</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">5. recipes</div>
                  <div className="text-stone-500">PK: id | FK: menu_item_id | name, serving_size, instructions</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">6. recipe_ingredients</div>
                  <div className="text-stone-500">PK: id | FK: recipe_id, FK: ingredient_id | quantity_required (Unique Constraint)</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">7. orders</div>
                  <div className="text-stone-500">PK: id | FK: customer_id | order_number, status, scheduled_pickup_time, actual_pickup_time, total_amount</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">8. order_items</div>
                  <div className="text-stone-500">PK: id | FK: order_id, FK: menu_item_id | quantity, unit_price, subtotal</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">9. payments</div>
                  <div className="text-stone-500">PK: id | FK: order_id | method, status, transaction_reference, amount, is_mock</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">10. pickup_verifications</div>
                  <div className="text-stone-500">PK: id | FK: order_id, FK: verified_by_user_id | verification_code (4-digit), is_verified, verified_at</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">11. inventory_reservations</div>
                  <div className="text-stone-500">PK: id | FK: order_id, FK: ingredient_id | quantity_reserved, status ('held', 'consumed', 'released')</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">12. inventory_transactions</div>
                  <div className="text-stone-500">PK: id | FK: ingredient_id, FK: order_id, FK: user_id | transaction_type, quantity_change, balance_after, reason</div>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                  <div className="font-bold text-emerald-800">13. notifications</div>
                  <div className="text-stone-500">PK: id | FK: user_id | title, message, notification_type, is_read, related_order_id</div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: WINDOWS & VS CODE SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Follow these exact steps to run the full application locally in VS Code on Windows 10/11:
              </p>

              {[
                {
                  title: 'Step 1: Clone & Open in VS Code',
                  cmd: 'git clone <repo-url>\ncode .'
                },
                {
                  title: 'Step 2: Create Python Virtual Environment (Windows PowerShell)',
                  cmd: 'python -m venv venv\n.\\venv\\Scripts\\activate'
                },
                {
                  title: 'Step 3: Install Backend Python Dependencies',
                  cmd: 'pip install -r backend/requirements.txt'
                },
                {
                  title: 'Step 4: Configure PostgreSQL Database & Seed Sample Data',
                  cmd: '# In psql or pgAdmin:\nCREATE DATABASE smart_cafeteria;\n\n# Populate initial users, ingredients, recipes, and menu items:\npython backend/seed_data.py'
                },
                {
                  title: 'Step 5: Start FastAPI Server (Port 8000)',
                  cmd: 'uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000\n# Interactive Swagger docs available at: http://localhost:8000/docs'
                },
                {
                  title: 'Step 6: Run Automated Tests with Pytest',
                  cmd: 'pytest backend/tests'
                },
                {
                  title: 'Step 7: Start React Frontend in a Second Terminal (Port 3000)',
                  cmd: 'npm install\nnpm run dev'
                }
              ].map((step, idx) => (
                <div key={idx} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-stone-900 text-xs">
                    <span>{step.title}</span>
                    <button
                      onClick={() => copyToClipboard(step.cmd, idx)}
                      className="text-stone-400 hover:text-stone-700 p-1 flex items-center gap-1 text-[11px]"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-stone-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {step.cmd}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DEMO SCRIPT */}
          {activeTab === 'demo_script' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                <strong>Faculty PBL Evaluation Walkthrough:</strong> Follow this 5-minute script to demonstrate all requirements end-to-end.
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="font-bold text-stone-900 text-xs">1. Customer Browsing & Allergen Inspection</div>
                  <p className="text-stone-600 text-[11px]">
                    Browse as Student <strong>Alex Chen</strong>. Use category pills and dietary filters (Veg / Vegan / GF). Click "Recipe & Stock" on the <em>Artisan Triple Cheddar Toastie</em> to demonstrate the real-time breakdown of required bread slices and cheese portions.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="font-bold text-stone-900 text-xs">2. Pre-Order & Atomic Reservation</div>
                  <p className="text-stone-600 text-[11px]">
                    Add items to cart, select a scheduled pickup time, choose Campus Card (mock payment), and confirm. Note the generated Order ID (e.g. <code>CB-2026-XXXX</code>) and prominent 4-digit pickup code (e.g. <code>7491</code>).
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="font-bold text-stone-900 text-xs">3. Real-Time Kitchen Dispatch (Switch to Chef Mario)</div>
                  <p className="text-stone-600 text-[11px]">
                    Use the top role switcher to change to <strong>Chef Mario Rossi</strong>. Instantly see the newly placed order in the "New Queue". Click "Accept Order", then click "Start Cooking" — observe how ingredients are consumed and reservations cleared.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="font-bold text-stone-900 text-xs">4. Counter Handover & Code Verification</div>
                  <p className="text-stone-600 text-[11px]">
                    Mark the order as "Ready at Counter B". The customer sees the stage update in their live tracker. Staff clicks "Verify Code & Handover", enters the student's 4-digit code. Handover succeeds and order is marked <code>COLLECTED</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="font-bold text-stone-900 text-xs">5. Administrative Inventory & Analytics (Switch to Elena)</div>
                  <p className="text-stone-600 text-[11px]">
                    Switch to <strong>Elena Vance</strong>. Review ingredient stocks, log deliveries or waste with audit reasons, inspect the audit ledger, and click "Export Sales (CSV)" to download an authentic Excel/CSV report.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-stone-400">
            College PBL Project • Smart Cafeteria Pre-Order & Inventory Management System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
          >
            Close Manual
          </button>
        </div>

      </div>
    </div>
  );
};
