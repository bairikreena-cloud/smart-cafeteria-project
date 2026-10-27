import React, { useMemo } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, Clock, 
  ArrowRight, ShieldCheck, MessageSquare 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    cart, isCartOpen, setIsCartOpen, removeFromCart, 
    updateQuantity, clearCart, subtotal, taxAmount, 
    totalAmount, scheduledPickupTime, setScheduledPickupTime,
    customerNotes, setCustomerNotes
  } = useCart();

  // Generate sensible upcoming pickup timeslots
  const timeSlots = useMemo(() => {
    const slots = [];
    const now = new Date();
    
    // Earliest slot: 15 mins
    const earliest = new Date(now.getTime() + 15 * 60000);
    slots.push({
      label: `Earliest Available (~${earliest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      iso: earliest.toISOString()
    });

    // 30 mins
    const in30 = new Date(now.getTime() + 30 * 60000);
    slots.push({
      label: `In 30 mins (${in30.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      iso: in30.toISOString()
    });

    // 45 mins
    const in45 = new Date(now.getTime() + 45 * 60000);
    slots.push({
      label: `In 45 mins (${in45.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      iso: in45.toISOString()
    });

    // 60 mins
    const in60 = new Date(now.getTime() + 60 * 60000);
    slots.push({
      label: `In 1 hour (${in60.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      iso: in60.toISOString()
    });

    return slots;
  }, []);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-stone-900 text-base">Your Pre-Order Cart</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-800">Your cart is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Browse our campus menu, add your favorite chef-crafted meals, and schedule a pickup time.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Explore Menu Items
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
                  <span>Selected Dishes</span>
                  <button onClick={clearCart} className="text-red-600 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear Cart
                  </button>
                </div>

                <div className="divide-y divide-stone-100 space-y-3">
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                      <img 
                        src={item.menuItem.imageUrl} 
                        alt={item.menuItem.name} 
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {item.menuItem.name}
                        </h4>
                        <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                          ${item.menuItem.price.toFixed(2)} each
                        </div>
                        {item.menuItem.allergens && (
                          <div className="text-[9px] text-stone-400 truncate">
                            Allergens: {item.menuItem.allergens}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-stone-100 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="p-1 rounded text-stone-600 hover:text-stone-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= item.menuItem.availablePortions}
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="p-1 rounded text-stone-600 hover:text-stone-900 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        className="text-stone-300 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pickup Time Selection */}
                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Scheduled Pickup Time</span>
                  </label>
                  <select
                    value={scheduledPickupTime}
                    onChange={e => setScheduledPickupTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot.iso} value={slot.iso}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary Notes for Kitchen */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                    <span>Kitchen Notes / Dietary Requests</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Extra napkins, dressing on side, please cut sandwich in half..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer & Price Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Campus Facility Fee / Tax (5%)</span>
                  <span className="font-mono font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-900 font-extrabold text-sm pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-700 text-base">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Proceed to Pre-Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Ingredients will be atomically reserved upon order submission</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
