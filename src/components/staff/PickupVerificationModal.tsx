import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';
import { StorageEngine } from '../../services/storageEngine';

interface PickupVerificationModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PickupVerificationModal: React.FC<PickupVerificationModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!order) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = StorageEngine.verifyPickupCode(order.id, code);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setCode('');
        onSuccess();
        onClose();
      }, 900);
    } else {
      setError(result.error || 'Invalid code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Counter Handover</h3>
              <p className="text-[10px] text-stone-500">Verify Customer Pickup Code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Preview */}
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
          <div className="flex justify-between font-bold text-stone-800">
            <span>Order #{order.orderNumber}</span>
            <span>{order.customerName}</span>
          </div>
          <div className="text-[11px] text-stone-500">
            {order.items.map(i => `${i.menuItemName} (x${i.quantity})`).join(', ')}
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-bold text-stone-700 block">
              Enter 4-Digit Code Shown on Student App:
            </label>
            <input
              type="text"
              maxLength={4}
              autoFocus
              placeholder="••••"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest font-mono text-3xl font-black py-3 rounded-2xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-stone-900"
            />
            <span className="text-[10px] text-stone-400 block pt-0.5">
              (Demo helper: Actual code is <strong className="font-mono text-emerald-700">{order.verificationCode}</strong>)
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Code verified! Order marked as collected.</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={code.length !== 4 || isSuccess}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Complete</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
