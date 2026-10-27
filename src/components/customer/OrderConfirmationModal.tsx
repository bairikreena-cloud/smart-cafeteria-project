import React from 'react';
import { CheckCircle2, Clock, MapPin, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { Order } from '../../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewTracker: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewTracker
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95 duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-5 text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Animated Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Pre-Order Confirmed
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Order #{order.orderNumber}
          </h2>
          <p className="text-xs text-stone-500">
            Ingredients atomically reserved. Sent to kitchen display.
          </p>
        </div>

        {/* 4-Digit Pickup Verification Code Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 border-2 border-dashed border-emerald-300 space-y-1.5">
          <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pickup Verification Code</span>
          </div>
          <div className="font-mono text-4xl font-black tracking-widest text-emerald-800 py-1">
            {order.verificationCode}
          </div>
          <p className="text-[10px] text-stone-500">
            Show this 4-digit code to the counter staff when your order is ready.
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-left text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
          <div className="space-y-0.5">
            <span className="text-[10px] text-stone-400 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pickup Time
            </span>
            <span className="font-bold text-stone-800">
              {new Date(order.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-stone-400 block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Pickup Counter
            </span>
            <span className="font-bold text-stone-800">Counter B (Express)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onViewTracker();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
          >
            <span>Track Order Progress in Real-Time</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
          >
            Back to Menu
          </button>
        </div>

      </div>
    </div>
  );
};
