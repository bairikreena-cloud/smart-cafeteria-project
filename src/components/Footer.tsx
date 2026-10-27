import React from 'react';
import { UtensilsCrossed, Clock, MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  openPblModal: () => void;
  openConcurrencyModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ openPblModal, openConcurrencyModal }) => {
  return (
    <footer className="mt-16 bg-white border-t border-stone-200 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-stone-900 text-base">SmartBite</span>
            </div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              University Commons pre-order & automated recipe-level inventory control system.
            </p>
            <div className="text-[10px] text-stone-400">
              College PBL Project Demonstration Edition
            </div>
          </div>

          {/* Operational Hours */}
          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cafeteria Hours</span>
            </h4>
            <div className="space-y-1 text-stone-500 text-[11px]">
              <div>Mon – Fri: 7:30 AM – 7:30 PM</div>
              <div>Saturday: 8:00 AM – 4:00 PM</div>
              <div>Sunday: Closed for deep pantry audit</div>
            </div>
          </div>

          {/* Counter locations */}
          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Counters</span>
            </h4>
            <div className="space-y-1 text-stone-500 text-[11px]">
              <div><strong>Counter A:</strong> Walk-in & Hot Grille</div>
              <div><strong>Counter B:</strong> Express App Pre-Orders</div>
              <div><strong>Beverage Bar:</strong> Cold Brew & Smoothies</div>
            </div>
          </div>

          {/* PBL Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PBL Evaluation Hub</span>
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <button 
                onClick={openPblModal}
                className="text-emerald-700 hover:text-emerald-900 font-semibold block hover:underline"
              >
                Architecture & 13-Table Schema
              </button>
              <button 
                onClick={openConcurrencyModal}
                className="text-emerald-700 hover:text-emerald-900 font-semibold block hover:underline"
              >
                Test Atomic Concurrency & Locking
              </button>
              <button 
                onClick={openPblModal}
                className="text-stone-500 hover:text-stone-800 block"
              >
                Windows VS Code Setup Commands
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <div>
            Smart Cafeteria Pre-Order & Inventory Management System © {new Date().getFullYear()}. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with React, FastAPI, SQLAlchemy & PostgreSQL</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
