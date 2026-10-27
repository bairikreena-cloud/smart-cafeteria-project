import React, { useState } from 'react';
import { X, History, Filter, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { InventoryTransaction } from '../../types';

interface InventoryAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: InventoryTransaction[];
}

export const InventoryAuditLogModal: React.FC<InventoryAuditLogModalProps> = ({
  isOpen,
  onClose,
  transactions
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.transactionType === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                Inventory Transaction Audit Ledger
              </h3>
              <p className="text-[11px] text-stone-500">
                Immutable trace of atomic reservations, consumptions, restocks, and spoilage.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-stone-100 flex items-center gap-2 bg-stone-50/30 overflow-x-auto text-xs shrink-0">
          <span className="text-stone-400 font-bold uppercase text-[10px] pl-1">Filter:</span>
          {['ALL', 'order_reservation', 'order_consumption', 'order_cancellation_restore', 'purchase', 'waste_spoilage'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === type
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {type === 'ALL' ? 'All Activity' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="overflow-y-auto flex-1 divide-y divide-stone-100 text-xs">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-stone-400">No transactions recorded under this filter.</div>
          ) : (
            filtered.map(tx => {
              const isPositive = tx.quantityChange > 0;

              return (
                <div key={tx.id} className="p-3.5 hover:bg-stone-50/60 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      tx.transactionType === 'purchase'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.transactionType === 'waste_spoilage'
                        ? 'bg-red-100 text-red-800'
                        : tx.transactionType === 'order_reservation'
                        ? 'bg-amber-100 text-amber-800'
                        : tx.transactionType === 'order_consumption'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{tx.ingredientName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 uppercase">
                          {tx.transactionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{tx.reason}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isPositive ? `+${tx.quantityChange.toFixed(1)}` : `${tx.quantityChange.toFixed(1)}`}
                    </span>
                    <span className="block text-[10px] font-mono text-stone-400">
                      Balance: {tx.balanceAfter.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })
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
