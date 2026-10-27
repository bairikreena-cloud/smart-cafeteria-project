import React, { useState } from 'react';
import { 
  X, Zap, ShieldCheck, Play, RotateCcw, 
  CheckCircle2, XCircle, AlertCircle, Layers 
} from 'lucide-react';
import { MenuItem } from '../../types';
import { StorageEngine } from '../../services/storageEngine';

interface ConcurrencyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onRefreshData: () => void;
}

export const ConcurrencyTestModal: React.FC<ConcurrencyTestModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onRefreshData
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(menuItems[0]?.id || 1);
  const [simulatedUsers, setSimulatedUsers] = useState<number>(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultStats, setResultStats] = useState<{ success: number; rejected: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const targetItem = menuItems.find(m => m.id === selectedItemId) || menuItems[0];

  const handleRunTest = () => {
    setIsRunning(true);
    setLogs([]);
    setResultStats(null);

    setTimeout(() => {
      const { logs: execLogs, successCount, rejectedCount } = StorageEngine.runConcurrencyStressTest(
        targetItem.id,
        simulatedUsers
      );

      setLogs(execLogs);
      setResultStats({ success: successCount, rejected: rejectedCount });
      setIsRunning(false);
      onRefreshData();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in zoom-in-95">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-emerald-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">
                PBL Live Concurrency & Atomic Locking Simulator
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Verifies race-condition protection and zero-overselling when multiple students order simultaneously.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
            <div className="font-bold text-stone-900">Evaluation Test Scenario:</div>
            <p className="text-stone-600 leading-relaxed text-[11px]">
              When multiple students click "Confirm Pre-Order" at the exact same second for a dish with limited recipe ingredients, the system executes atomic row-level reservation. Orders succeed until ingredients hit the ceiling, and remaining simultaneous orders are safely blocked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Target Menu Item to Stress Test</label>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/20"
              >
                {menuItems.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.availablePortions} portions in stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Simultaneous Concurrent Pre-Orders</label>
              <select
                value={simulatedUsers}
                onChange={e => setSimulatedUsers(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={3}>3 Simultaneous Orders</option>
                <option value={5}>5 Simultaneous Orders</option>
                <option value={10}>10 Simultaneous Orders</option>
                <option value={20}>20 Simultaneous Orders</option>
              </select>
            </div>
          </div>

          {/* Target Item Current Status */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-500 text-[11px] block">Selected Test Dish:</span>
              <span className="font-bold text-stone-900">{targetItem.name}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 text-[11px] block">Current Available Portions:</span>
              <span className="font-mono font-black text-sm text-emerald-800">
                {targetItem.availablePortions} Portions
              </span>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Atomic Concurrency Test ({simulatedUsers} Concurrent Requests)</span>
          </button>

          {/* Results Summary Badges */}
          {resultStats && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{resultStats.success} Orders Accepted & Reserved</span>
              </div>
              <div className="p-3 bg-red-100/70 border border-red-300 rounded-2xl flex items-center gap-2 text-red-950 font-bold">
                <XCircle className="w-4 h-4 text-red-700" />
                <span>{resultStats.rejected} Orders Blocked (No Oversell)</span>
              </div>
            </div>
          )}

          {/* Execution Log Terminal */}
          {logs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Live Transaction & Lock Trace
              </span>
              <div className="bg-stone-900 text-stone-200 font-mono text-[11px] p-4 rounded-2xl max-h-48 overflow-y-auto space-y-1 border border-stone-800">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={
                      log.includes('[SUCCESS]')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('[REJECTED')
                        ? 'text-amber-400 font-semibold'
                        : 'text-stone-400'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-stone-400">
            Backed by PostgreSQL row-level locks & FastAPI database transactions
          </span>
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
