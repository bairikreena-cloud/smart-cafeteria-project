import React, { useState } from 'react';
import { 
  ChefHat, Clock, AlertTriangle, CheckCircle2, 
  KeyRound, ArrowRight, XCircle, Play, Sparkles, Filter 
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { StorageEngine } from '../../services/storageEngine';
import { PickupVerificationModal } from './PickupVerificationModal';

interface KitchenOrdersBoardProps {
  orders: Order[];
  onRefreshOrders: () => void;
}

export const KitchenOrdersBoard: React.FC<KitchenOrdersBoardProps> = ({
  orders,
  onRefreshOrders
}) => {
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'active' | 'completed'>('active');

  const handleUpdateStatus = (orderId: number, status: OrderStatus, reason?: string) => {
    const res = StorageEngine.updateOrderStatus(orderId, status, reason);
    if (res.success) {
      onRefreshOrders();
    } else {
      alert(res.error || 'Failed to update order status.');
    }
  };

  const handleReject = (orderId: number) => {
    const reason = prompt('Please specify rejection reason for customer (e.g. kitchen ingredient defect, equipment issue):') || 'Kitchen capacity limit';
    handleUpdateStatus(orderId, 'rejected', reason);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const acceptedOrders = orders.filter(o => o.status === 'accepted');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup');
  const collectedOrders = orders.filter(o => o.status === 'collected');

  // Check if an order pickup is delayed
  const isDelayed = (scheduledIso: string) => {
    return new Date(scheduledIso).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      
      {/* Board Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                Kitchen Expeditor & Order Dispatch Board
              </h2>
              <p className="text-xs text-stone-500">
                Manage incoming student pre-orders, stage prep workflows, and verify pickup codes.
              </p>
            </div>
          </div>
        </div>

        {/* Status Counts */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingOrders.length} New Incoming</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1.5">
            <span>🍳 {preparingOrders.length} In Prep</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
            <span>🔔 {readyOrders.length} Ready at Counter</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Column 1: New Pending Orders */}
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>1. NEW QUEUE ({pendingOrders.length})</span>
            </div>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {pendingOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                No new pending orders
              </div>
            ) : (
              pendingOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

        {/* Column 2: Accepted & Cooking Queue */}
        <div className="space-y-3">
          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>2. ACCEPTED ({acceptedOrders.length})</span>
            </div>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {acceptedOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                No orders waiting for cook
              </div>
            ) : (
              acceptedOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

        {/* Column 3: In Preparation */}
        <div className="space-y-3">
          <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-purple-900">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>3. PREPARING ({preparingOrders.length})</span>
            </div>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {preparingOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                No meals actively being prepared
              </div>
            ) : (
              preparingOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

        {/* Column 4: Ready for Counter Pickup */}
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>4. READY AT COUNTER ({readyOrders.length})</span>
            </div>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {readyOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                No orders waiting at counter
              </div>
            ) : (
              readyOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

      </div>

      {/* Verification Modal Dialog */}
      {verifyingOrder && (
        <PickupVerificationModal
          order={verifyingOrder}
          onClose={() => setVerifyingOrder(null)}
          onSuccess={() => onRefreshOrders()}
        />
      )}

    </div>
  );

  function renderOrderCard(order: Order) {
    const delayed = isDelayed(order.scheduledPickupTime);

    return (
      <div 
        key={order.id}
        className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all space-y-3"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span>#{order.orderNumber}</span>
              {delayed && order.status !== 'collected' && (
                <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" /> Delay
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-stone-700">{order.customerName}</div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-stone-400">Target Pickup</div>
            <div className="font-mono font-bold text-xs text-stone-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              {new Date(order.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 space-y-1 text-xs">
          {order.items.map(it => (
            <div key={it.id} className="flex justify-between items-center text-stone-800 font-medium">
              <span className="truncate pr-2">{it.menuItemName}</span>
              <span className="font-bold font-mono shrink-0">×{it.quantity}</span>
            </div>
          ))}
          {order.customerNotes && (
            <div className="text-[10px] text-amber-900 bg-amber-50/80 p-1 rounded-sm mt-1 border border-amber-200/60 font-medium italic">
              Note: {order.customerNotes}
            </div>
          )}
        </div>

        {/* Verification Code pill for staff convenience */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
          <span>Counter Verification Code:</span>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {order.verificationCode}
          </span>
        </div>

        {/* Contextual Workflow Action Buttons */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => handleReject(order.id)}
                className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 text-xs font-semibold"
                title="Reject with Reason"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleUpdateStatus(order.id, 'accepted')}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Accept Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {order.status === 'accepted' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'preparing')}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Cooking (Deduct Stock)</span>
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Ready at Counter B</span>
            </button>
          )}

          {order.status === 'ready_for_pickup' && (
            <button
              onClick={() => setVerifyingOrder(order)}
              className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Code & Handover</span>
            </button>
          )}
        </div>

      </div>
    );
  }
};
