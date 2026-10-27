import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, KeyRound, 
  ChefHat, ShoppingBag, XCircle, ChevronRight, History 
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { StorageEngine } from '../../services/storageEngine';
import { useAuth } from '../../context/AuthContext';

interface LiveOrderTrackerProps {
  orders: Order[];
  onRefreshOrders: () => void;
  openOrderHistory: () => void;
  onSelectOrderDetails?: (order: Order) => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'Awaiting kitchen queue' },
  { key: 'accepted', label: 'Accepted', desc: 'Queued for prep' },
  { key: 'preparing', label: 'Preparing', desc: 'Chef cooking freshly' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', desc: 'Waiting at Counter B' },
  { key: 'collected', label: 'Collected', desc: 'Handed over' }
];

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  orders,
  onRefreshOrders,
  openOrderHistory
}) => {
  const { currentUser } = useAuth();
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Customer only sees their orders
  const myOrders = orders.filter(o => o.customerId === currentUser.id);

  // Split into active and completed
  const activeOrders = myOrders.filter(o => 
    ['pending', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
  );

  const handleCancel = (orderId: number) => {
    const reason = prompt('Please enter the reason for cancellation:') || 'Customer requested cancellation';
    const result = StorageEngine.updateOrderStatus(orderId, 'cancelled', reason);
    if (result.success) {
      alert('Order successfully cancelled. Reserved ingredients have been restored to cafeteria inventory.');
      onRefreshOrders();
    } else {
      alert(result.error || 'Failed to cancel order.');
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready_for_pickup': return 3;
      case 'collected': return 4;
      default: return -1;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Live Pre-Order Tracker</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </h2>
          <p className="text-xs text-stone-500">
            Real-time status updates broadcasted directly from the kitchen line.
          </p>
        </div>

        <button
          onClick={openOrderHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-xs"
        >
          <History className="w-4 h-4 text-stone-400" />
          <span>View Past Orders</span>
        </button>
      </div>

      {/* Active Orders List */}
      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-sm">No Active Orders In Progress</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You do not currently have any pending cafeteria orders. Place a pre-order from the food menu to track it here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.map(order => {
            const currentStep = getStepIndex(order.status);
            const canCancel = ['pending', 'accepted'].includes(order.status);
            const isReady = order.status === 'ready_for_pickup';

            return (
              <div 
                key={order.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                  isReady 
                    ? 'border-emerald-400 ring-4 ring-emerald-500/10' 
                    : 'border-stone-200'
                }`}
              >
                {/* Top Banner */}
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 ${
                  isReady ? 'bg-emerald-600 text-white' : 'bg-stone-50/80 border-b border-stone-100'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-extrabold ${isReady ? 'text-white' : 'text-stone-900'}`}>
                        Order #{order.orderNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isReady 
                          ? 'bg-emerald-800 text-emerald-100' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={`text-xs ${isReady ? 'text-emerald-100' : 'text-stone-500'}`}>
                      Scheduled for {new Date(order.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Counter B
                    </div>
                  </div>

                  {/* 4-digit code in banner */}
                  <div className={`px-4 py-2 rounded-2xl flex items-center gap-2.5 ${
                    isReady 
                      ? 'bg-white text-emerald-900 shadow-md' 
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  }`}>
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">Pickup Code</span>
                      <span className="font-mono text-lg font-black tracking-widest">{order.verificationCode}</span>
                    </div>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="p-6 border-b border-stone-100">
                  <div className="relative">
                    {/* Background line */}
                    <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0">
                      <div 
                        className="h-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, (currentStep / 3) * 100)}%` }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="relative z-10 flex justify-between">
                      {STATUS_STEPS.slice(0, 4).map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center max-w-[80px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-white border-2 border-emerald-600 text-emerald-700 ring-4 ring-emerald-500/20'
                                : 'bg-white border border-stone-300 text-stone-400'
                            }`}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[11px] font-bold mt-2 ${
                              isCurrent ? 'text-emerald-700' : isCompleted ? 'text-stone-800' : 'text-stone-400'
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[9px] text-stone-400 mt-0.5 hidden sm:block">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Items & Actions */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Ordered Dishes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map(it => (
                        <span key={it.id} className="text-xs bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg font-medium">
                          {it.menuItemName} <strong className="font-bold">× {it.quantity}</strong>
                        </span>
                      ))}
                    </div>
                    {order.customerNotes && (
                      <div className="text-[11px] text-stone-500 italic pt-1">
                        Notes: "{order.customerNotes}"
                      </div>
                    )}
                  </div>

                  {/* Cancellation or instructions */}
                  <div className="flex items-center gap-3">
                    {canCancel ? (
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Order</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        {order.status === 'preparing' && '🍳 In kitchen prep (No cancellations)'}
                        {order.status === 'ready_for_pickup' && '🔔 Ready at Counter B! Show pickup code.'}
                      </span>
                    )}
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
