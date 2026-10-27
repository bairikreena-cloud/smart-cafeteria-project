import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, Clock, AlertCircle, 
  Sparkles, Leaf, Wheat, Heart, Info, Plus, Check
} from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';

interface MenuCatalogProps {
  menuItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({ menuItems, onSelectItem }) => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVeg, setFilterVeg] = useState<boolean>(false);
  const [filterVegan, setFilterVegan] = useState<boolean>(false);
  const [filterGf, setFilterGf] = useState<boolean>(false);
  const [addedItemMap, setAddedItemMap] = useState<{ [id: number]: boolean }>({});

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(menuItems.map(m => m.category))];
    return cats;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (filterVeg && !item.isVegetarian) return false;
      if (filterVegan && !item.isVegan) return false;
      if (filterGf && !item.isGlutenFree) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchAllergens = item.allergens?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchAllergens) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, filterVeg, filterVegan, filterGf]);

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    const result = addToCart(item, 1);
    if (result.success) {
      setAddedItemMap(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setAddedItemMap(prev => ({ ...prev, [item.id]: false }));
      }, 1200);
    } else if (result.message) {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome & Operational Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 md:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-xs text-xs font-semibold text-emerald-100 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Campus Dining Pre-Order Portal • Kitchen Open</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Order ahead. Skip the rush. Fresh food on your schedule.
          </h1>
          <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed">
            Choose your pickup time, customize healthy chef-prepared items, and verify with your digital pickup code at Counter B.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-200">
            <div className="flex items-center gap-1.5 bg-emerald-900/40 px-3 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Avg. Prep Time: <strong>8–12 mins</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/40 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Inventory Sync: <strong>Real-Time Automatic</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, ingredients, or allergens (e.g. sourdough, wrap, gluten)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          {/* Dietary Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterVeg(!filterVeg)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterVeg 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Vegetarian</span>
            </button>

            <button
              onClick={() => setFilterVegan(!filterVegan)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterVegan 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Vegan</span>
            </button>

            <button
              onClick={() => setFilterGf(!filterGf)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterGf 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>Gluten-Free</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-700">No matching food items found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search terms or dietary filters to view delicious campus meals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isOutOfStock = !item.isInStock || item.availablePortions <= 0;
            const isJustAdded = addedItemMap[item.id];

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer hover:border-emerald-500/40"
              >
                {/* Image Container */}
                <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {item.category}
                  </span>

                  {/* Stock Availability Tag */}
                  <div className="absolute top-3 right-3">
                    {isOutOfStock ? (
                      <span className="bg-red-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        Out of Stock
                      </span>
                    ) : item.availablePortions <= 5 ? (
                      <span className="bg-amber-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                        Only {item.availablePortions} left!
                      </span>
                    ) : (
                      <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {item.availablePortions} available
                      </span>
                    )}
                  </div>

                  {/* Dietary Badges overlay bottom left */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
                    {item.isVegetarian && (
                      <span className="bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Leaf className="w-2.5 h-2.5" /> Veg
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="bg-teal-950/80 backdrop-blur-xs text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" /> Vegan
                      </span>
                    )}
                    {item.isGlutenFree && (
                      <span className="bg-amber-950/80 backdrop-blur-xs text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Wheat className="w-2.5 h-2.5" /> GF
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-base">
                        {item.name}
                      </h3>
                      <span className="font-extrabold text-base text-stone-900 font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Allergen & Prep Info */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <div className="flex items-center gap-1 text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.prepTimeMinutes} mins prep</span>
                    </div>
                    {item.allergens && (
                      <div className="text-[10px] text-stone-400 italic truncate max-w-[150px]">
                        Contains: {item.allergens}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                      className="flex-1 text-center py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 text-stone-400" />
                      <span>Recipe & Stock</span>
                    </button>

                    <button
                      disabled={isOutOfStock}
                      onClick={(e) => handleQuickAdd(e, item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isOutOfStock 
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                          : isJustAdded
                          ? 'bg-emerald-700 text-white scale-95'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pre-Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
