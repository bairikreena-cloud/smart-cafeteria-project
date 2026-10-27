import React, { useState } from 'react';
import { 
  X, CreditCard, QrCode, Wallet, Banknote, 
  ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { PaymentMethod, Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { StorageEngine } from '../../services/storageEngine';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { currentUser } = useAuth();
  const { cart, totalAmount, scheduledPickupTime, customerNotes, clearCart, setIsCartOpen } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('campus_card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Simulate short network latency
    setTimeout(() => {
      const result = StorageEngine.placeOrder(
        currentUser.id,
        currentUser.fullName,
        currentUser.email,
        cart,
        scheduledPickupTime,
        paymentMethod,
        customerNotes
      );

      setIsSubmitting(false);

      if (result.success && result.order) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore if canvas not supported
        }

        clearCart();
        setIsCartOpen(false);
        onOrderSuccess(result.order);
      } else {
        setErrorMessage(result.error || 'Failed to place order due to stock constraints.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">Complete Pre-Order</h3>
            <p className="text-[11px] text-stone-500">Atomic Stock Reservation & Mock Payment</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-5 space-y-4">
          
          {/* PBL Academic Demonstration Disclaimer */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">PBL Demonstration Notice:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Payments are simulated for this university demonstration. No actual cards or financial accounts are charged.
              </p>
            </div>
          </div>

          {/* Customer & Order Summary */}
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Ordering Account:</span>
              <span className="font-semibold text-stone-900">{currentUser.fullName}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Scheduled Pickup:</span>
              <span className="font-semibold text-stone-900">
                {new Date(scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-stone-900 font-extrabold text-sm pt-1.5 border-t border-stone-200">
              <span>Total Payable:</span>
              <span className="font-mono text-emerald-700 text-base">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Select Mock Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              
              <button
                type="button"
                onClick={() => setPaymentMethod('campus_card')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'campus_card'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'campus_card' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="font-bold text-xs">Campus Card</div>
                  <div className="text-[10px] text-stone-500">Student ID / Meal Plan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'upi' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="font-bold text-xs">Campus UPI / QR</div>
                  <div className="text-[10px] text-stone-500">Instant Mobile Pay</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_counter')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'cash_counter'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'cash_counter' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="font-bold text-xs">Counter Cash</div>
                  <div className="text-[10px] text-stone-500">Pay upon collection</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'card' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="font-bold text-xs">Debit / Credit</div>
                  <div className="text-[10px] text-stone-500">Visa / Mastercard</div>
                </div>
              </button>

            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Ingredients & Placing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Authorize ${totalAmount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
