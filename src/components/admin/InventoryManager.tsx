import React, { useState } from 'react';
import { 
  Layers, AlertTriangle, Plus, History, PackagePlus, 
  Trash2, TrendingDown, Clock, Search, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Ingredient, InventoryTransaction } from '../../types';
import { StorageEngine } from '../../services/storageEngine';
import { InventoryAuditLogModal } from './InventoryAuditLogModal';

interface InventoryManagerProps {
  ingredients: Ingredient[];
  transactions: InventoryTransaction[];
  onRefreshData: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  ingredients,
  transactions,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'purchase' | 'waste_spoilage' | 'adjustment'>('purchase');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Ingredient form state
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<'Produce' | 'Dairy' | 'Bakery' | 'Protein' | 'Beverage' | 'Pantry'>('Produce');
  const [newUnit, setNewUnit] = useState('units');
  const [newStock, setNewStock] = useState('50');
  const [newMin, setNewMin] = useState('15');
  const [newCost, setNewCost] = useState('1.50');

  const categories = ['All', 'Produce', 'Dairy', 'Bakery', 'Protein', 'Beverage', 'Pantry'];

  const filteredIngredients = ingredients.filter(ing => {
    if (selectedCategory !== 'All' && ing.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return ing.name.toLowerCase().includes(q) || ing.category.toLowerCase().includes(q);
    }
    return true;
  });

  const lowStockCount = ingredients.filter(i => i.availableStock <= i.minimumThreshold).length;
  const criticalCount = ingredients.filter(i => i.availableStock === 0).length;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient) return;

    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    const change = adjustType === 'purchase' ? qty : -qty;
    const defaultReason = adjustType === 'purchase' 
      ? 'Supplier intake delivery' 
      : adjustType === 'waste_spoilage' 
      ? 'Spoilage or kitchen prep waste' 
      : 'Stock audit count reconciliation';

    const res = StorageEngine.adjustIngredientStock(
      adjustingIngredient.id,
      change,
      adjustType,
      adjustReason || defaultReason
    );

    if (res.success) {
      setAdjustingIngredient(null);
      setAdjustQty('');
      setAdjustReason('');
      onRefreshData();
    } else {
      alert(res.error || 'Failed to adjust stock.');
    }
  };

  const handleAddNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const list = StorageEngine.getIngredients();
    const newId = Date.now();
    const initStock = parseFloat(newStock) || 0;

    const newIng: Ingredient = {
      id: newId,
      name: newName.trim(),
      category: newCat,
      unit: newUnit,
      currentStock: initStock,
      reservedStock: 0,
      availableStock: initStock,
      minimumThreshold: parseFloat(newMin) || 10,
      costPerUnit: parseFloat(newCost) || 0,
      expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      supplierInfo: 'Direct Campus Sourcing',
      lastUpdated: new Date().toISOString()
    };

    list.push(newIng);
    StorageEngine.saveIngredients(list);
    StorageEngine.logTransaction(newId, newName, 'purchase', initStock, initStock, 'Initial inventory entry');

    setShowAddModal(false);
    setNewName('');
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tracked Ingredients</div>
          <div className="text-2xl font-black text-stone-900 font-mono">{ingredients.length} Items</div>
          <div className="text-[11px] text-stone-500">Across 6 pantry categories</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Reservations</div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {ingredients.reduce((a, b) => a + (b.reservedStock > 0 ? 1 : 0), 0)} Items Held
          </div>
          <div className="text-[11px] text-stone-500">Atomically locked for prep</div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xs space-y-1 ${
          lowStockCount > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-stone-200'
        }`}>
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Warnings</span>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{lowStockCount} Items</div>
          <div className="text-[11px] text-amber-700">At or below reorder threshold</div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xs space-y-1 ${
          criticalCount > 0 ? 'bg-red-50/80 border-red-300' : 'bg-white border-stone-200'
        }`}>
          <div className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Out of Stock (Zero)</span>
          </div>
          <div className="text-2xl font-black text-red-900 font-mono">{criticalCount} Items</div>
          <div className="text-[11px] text-red-700">Blocks menu portion orders</div>
        </div>
      </div>

      {/* Control Bar: Search, Category, Actions */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient pantry (e.g. bread, cheese, avocado)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-stone-500" />
            <span>Audit Ledger</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Ingredient & Category</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Physical Total</th>
                <th className="py-3 px-4">Reorder Status</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredIngredients.map(ing => {
                const isLow = ing.availableStock <= ing.minimumThreshold;
                const isZero = ing.availableStock === 0;
                const percent = Math.min(100, Math.round((ing.availableStock / (ing.minimumThreshold * 3)) * 100));

                return (
                  <tr key={ing.id} className="hover:bg-stone-50/70 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{ing.name}</div>
                      <div className="text-[10px] text-stone-400">{ing.category} • {ing.supplierInfo || 'Campus Supplier'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className={`font-black text-sm ${isZero ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {ing.availableStock.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-stone-400 pl-1">{ing.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-stone-500">
                      {ing.reservedStock > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                          {ing.reservedStock.toFixed(1)} {ing.unit}
                        </span>
                      ) : (
                        <span>0 {ing.unit}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-stone-700 font-medium">
                      {ing.currentStock.toFixed(1)} {ing.unit}
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className={isLow ? 'text-amber-800 font-bold' : 'text-stone-500'}>
                            Min: {ing.minimumThreshold} {ing.unit}
                          </span>
                          <span className="font-mono text-stone-400">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isZero ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-stone-500">
                      {ing.expiryDate ? (
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{ing.expiryDate}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setAdjustingIngredient(ing);
                          setAdjustType('purchase');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px]"
                        title="Record Delivery / Intake"
                      >
                        + Delivery
                      </button>

                      <button
                        onClick={() => {
                          setAdjustingIngredient(ing);
                          setAdjustType('waste_spoilage');
                        }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-800 hover:bg-red-100 font-bold text-[11px]"
                        title="Log Spoilage / Wastage"
                      >
                        - Waste
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 text-sm">
                {adjustType === 'purchase' ? 'Record Restock / Delivery' : 'Log Wastage & Spoilage'}
              </h3>
              <button onClick={() => setAdjustingIngredient(null)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl text-xs space-y-0.5 border border-stone-200">
              <div className="font-bold text-stone-900">{adjustingIngredient.name}</div>
              <div className="text-[11px] text-stone-500 font-mono">
                Current Available: {adjustingIngredient.availableStock} {adjustingIngredient.unit}
              </div>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Quantity ({adjustingIngredient.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder={`e.g. 20 ${adjustingIngredient.unit}`}
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Mandatory Audit Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder={adjustType === 'purchase' ? 'e.g. Batch #498 delivery' : 'e.g. Drop damage / expired date'}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingIngredient(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
                    adjustType === 'purchase'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 text-sm">Add New Pantry Ingredient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleAddNewIngredient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Baby Spinach"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Protein">Protein</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="slices, grams, ml, units"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newMin}
                    onChange={e => setNewMin(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Cost / Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={e => setNewCost(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      <InventoryAuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        transactions={transactions}
      />

    </div>
  );
};
