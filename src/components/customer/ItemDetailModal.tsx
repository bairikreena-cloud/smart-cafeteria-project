import React, { useState } from 'react';
import { 
  X, Clock, Leaf, Heart, Wheat, AlertTriangle, 
  Layers, CheckCircle2, Plus, Minus, ShoppingBag 
} from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!item) return null;

  const isOutOfStock = !item.isInStock || item.availablePortions <= 0;
  const maxAllowed = Math.max(1, item.availablePortions);

  const handleAdd = () => {
    const res = addToCart(item, quantity);
    if (res.success) {
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
      }, 800);
    } else if (res.message) {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative h-56 bg-stone-100 shrink-0">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover" 
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="absolute bottom-3 left-4 flex gap-1.5">
            {item.isVegetarian && (
              <span className="bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Veg
              </span>
            )}
            {item.isVegan && (
              <span className="bg-teal-950/80 backdrop-blur-xs text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Heart className="w-3 h-3" /> Vegan
              </span>
            )}
            {item.isGlutenFree && (
              <span className="bg-amber-950/80 backdrop-blur-xs text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Wheat className="w-3 h-3" /> Gluten-Free
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                {item.category}
              </span>
              <span className="text-xl font-black text-stone-900 font-mono">
                ${item.price.toFixed(2)}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900">{item.name}</h2>
            <p className="text-xs text-stone-600 leading-relaxed pt-1">{item.description}</p>
          </div>

          {/* Prep time & Stock stats */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-stone-400 block text-[10px]">Prep Time</span>
                <span className="font-bold text-stone-800">{item.prepTimeMinutes} Minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-stone-400 block text-[10px]">Pantry Availability</span>
                <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Sold Out' : `${item.availablePortions} Portions Ready`}
                </span>
              </div>
            </div>
          </div>

          {/* Allergen Warning Banner */}
          {item.allergens && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Allergen Notice:</span> Contains {item.allergens}. 
                Prepared in a kitchen environment handling nuts, dairy, and wheat.
              </div>
            </div>
          )}

          {/* Recipe Ingredients Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>Recipe & Ingredient Allocation</span>
              </h4>
              <span className="text-[10px] text-stone-500 font-medium">Per 1 serving</span>
            </div>
            
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
              {item.recipeIngredients && item.recipeIngredients.length > 0 ? (
                item.recipeIngredients.map(ri => (
                  <div key={ri.ingredientId} className="p-2.5 flex items-center justify-between bg-stone-50/40">
                    <div>
                      <span className="font-semibold text-stone-800">{ri.ingredientName}</span>
                      <span className="text-[10px] text-stone-500 block">
                        Requires: {ri.quantityRequired} {ri.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-medium text-stone-600">
                        {ri.availableStock.toFixed(1)} {ri.unit} in stock
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-stone-400">Standard cafeteria prep</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
            <button
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-1 rounded-md text-stone-500 hover:text-stone-900 disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-extrabold text-sm font-mono min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              disabled={quantity >= maxAllowed || isOutOfStock}
              onClick={() => setQuantity(q => Math.min(maxAllowed, q + 1))}
              className="p-1 rounded-md text-stone-500 hover:text-stone-900 disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {added ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Added to Pre-Order!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add {quantity} for ${(item.price * quantity).toFixed(2)}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
