import React from 'react';
import { X, Receipt, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders
}) => {
  const { currentUser } = useAuth();
  if (!isOpen) return null;

  const myPastOrders = orders.filter(o => o.customerId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">Your Order History</h3>
              <p className="text-[11px] text-stone-500">All registered pre-orders & meal receipts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="p-5 overflow-y-auto space-y-4">
          {myPastOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No orders placed yet.
            </div>
          ) : (
            myPastOrders.map(order => (
              <div 
                key={order.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/40 hover:bg-white transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">#{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      order.status === 'collected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-stone-100 text-xs">
                  {order.items.map(it => (
                    <div key={it.id} className="py-1 flex justify-between text-stone-700">
                      <span>{it.menuItemName} × {it.quantity}</span>
                      <span className="font-mono">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                  <span className="text-stone-500">
                    Payment Method: <strong className="uppercase text-stone-700">{order.paymentMethod.replace('_', ' ')}</strong>
                  </span>
                  <span className="font-bold text-sm font-mono text-stone-900">
                    Total: ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
