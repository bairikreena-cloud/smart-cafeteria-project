import React, { useState } from 'react';
import { 
  Utensils, Plus, Edit2, CheckCircle2, XCircle, 
  Layers, Clock, DollarSign, Image, Tag 
} from 'lucide-react';
import { MenuItem, Ingredient, RecipeIngredientDetail } from '../../types';
import { StorageEngine } from '../../services/storageEngine';

interface MenuManagerProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  onRefreshData: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  ingredients,
  onRefreshData
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sandwiches & Wraps');
  const [price, setPrice] = useState('7.50');
  const [prepTime, setPrepTime] = useState('10');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80');
  const [isVeg, setIsVeg] = useState(true);
  const [isVegan, setIsVegan] = useState(false);
  const [isGf, setIsGf] = useState(false);
  const [allergens, setAllergens] = useState('Dairy, Gluten');

  // Selected recipe ingredients
  const [selectedIngredients, setSelectedIngredients] = useState<
    { ingredientId: number; quantity: number }[]
  >([]);

  const handleToggleManualAvailability = (item: MenuItem) => {
    const list = StorageEngine.getMenuItems();
    const match = list.find(m => m.id === item.id);
    if (match) {
      match.isManuallyAvailable = !match.isManuallyAvailable;
      StorageEngine.saveMenuItems(list);
      onRefreshData();
    }
  };

  const handleAddRecipeIngredient = (ingId: number) => {
    if (selectedIngredients.some(s => s.ingredientId === ingId)) return;
    setSelectedIngredients(prev => [...prev, { ingredientId: ingId, quantity: 1.0 }]);
  };

  const handleUpdateRecipeQty = (ingId: number, qty: number) => {
    setSelectedIngredients(prev => prev.map(s => s.ingredientId === ingId ? { ...s, quantity: Math.max(0.1, qty) } : s));
  };

  const handleRemoveRecipeIngredient = (ingId: number) => {
    setSelectedIngredients(prev => prev.filter(s => s.ingredientId !== ingId));
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const list = StorageEngine.getMenuItems();
    const newId = Date.now();

    const recipeDetails: RecipeIngredientDetail[] = selectedIngredients.map(s => {
      const ing = ingredients.find(i => i.id === s.ingredientId);
      return {
        ingredientId: s.ingredientId,
        ingredientName: ing ? ing.name : 'Unknown',
        quantityRequired: s.quantity,
        unit: ing ? ing.unit : 'unit',
        availableStock: ing ? ing.availableStock : 0
      };
    });

    const newItem: MenuItem = {
      id: newId,
      name: name.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price) || 5.0,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      prepTimeMinutes: parseInt(prepTime) || 10,
      isVegetarian: isVeg,
      isVegan: isVegan,
      isGlutenFree: isGf,
      allergens: allergens.trim(),
      isManuallyAvailable: true,
      availablePortions: 0,
      isInStock: true,
      recipeIngredients: recipeDetails,
      createdAt: new Date().toISOString()
    };

    // Calculate actual portions using storage engine
    newItem.availablePortions = StorageEngine.calculateMenuItemPortions(newItem, ingredients);
    newItem.isInStock = newItem.availablePortions > 0;

    list.push(newItem);
    StorageEngine.saveMenuItems(list);

    setShowCreateModal(false);
    setName('');
    setDescription('');
    setSelectedIngredients([]);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            <span>Cafeteria Menu & Recipe Spec Management</span>
          </h2>
          <p className="text-xs text-stone-500">
            Link dishes to pantry ingredients so portion availability is computed automatically.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedIngredients([
              { ingredientId: ingredients[0]?.id || 1, quantity: 2.0 },
              { ingredientId: ingredients[1]?.id || 2, quantity: 1.0 }
            ]);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Menu Dish</span>
        </button>
      </div>

      {/* Grid of Dishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div 
            key={item.id}
            className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-stone-100">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md text-stone-800">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs text-white ${
                    item.availablePortions <= 0 ? 'bg-red-600' : 'bg-emerald-600'
                  }`}>
                    {item.availablePortions} Portions Ready
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-stone-900 text-sm">{item.name}</h3>
                  <span className="font-mono font-extrabold text-sm text-stone-900">${item.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-stone-500 line-clamp-2">{item.description}</p>

                {/* Recipe ingredients preview */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Recipe Ingredients:
                  </span>
                  <div className="space-y-0.5 text-[11px] text-stone-700">
                    {item.recipeIngredients && item.recipeIngredients.length > 0 ? (
                      item.recipeIngredients.map(ri => (
                        <div key={ri.ingredientId} className="flex justify-between">
                          <span>{ri.ingredientName}</span>
                          <span className="font-mono text-stone-500">
                            {ri.quantityRequired} {ri.unit}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-stone-400">No ingredient constraints</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Availability footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <span className="text-xs text-stone-600">
                Status: <strong className={item.isManuallyAvailable ? 'text-emerald-700' : 'text-red-600'}>
                  {item.isManuallyAvailable ? 'Enabled' : 'Paused by Staff'}
                </strong>
              </span>

              <button
                onClick={() => handleToggleManualAvailability(item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  item.isManuallyAvailable
                    ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {item.isManuallyAvailable ? 'Pause Dish' : 'Enable Dish'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Menu Dish Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-stone-900 text-base">Create Menu Dish & Recipe Spec</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avocado Toast Deluxe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Flavor notes, presentation, bread choice..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="Sandwiches & Wraps">Sandwiches & Wraps</option>
                    <option value="Bowls & Breakfast">Bowls & Breakfast</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Bakery & Snacks">Bakery & Snacks</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={e => setPrepTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              {/* Recipe Requirements Builder */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Select Recipe Ingredients Needed Per Serving</span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    id="add-ing-select"
                    className="flex-1 p-2 rounded-xl border border-stone-200 bg-white text-xs"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAddRecipeIngredient(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>+ Pick ingredient from inventory...</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.availableStock} {ing.unit} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected list */}
                <div className="space-y-1.5 pt-1">
                  {selectedIngredients.map(s => {
                    const ing = ingredients.find(i => i.id === s.ingredientId);
                    if (!ing) return null;

                    return (
                      <div key={s.ingredientId} className="p-2 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-800">{ing.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={s.quantity}
                            onChange={e => handleUpdateRecipeQty(s.ingredientId, parseFloat(e.target.value) || 0.1)}
                            className="w-16 p-1 rounded-lg border border-stone-200 text-center font-mono"
                          />
                          <span className="text-[11px] text-stone-500 w-12">{ing.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeIngredient(s.ingredientId)}
                            className="text-stone-400 hover:text-red-500 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Dish & Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
