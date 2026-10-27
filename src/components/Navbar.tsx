import React, { useState } from 'react';
import { 
  UtensilsCrossed, ShoppingBag, Bell, UserCircle, 
  ChefHat, ShieldCheck, BookOpen, Layers, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../types';
import { StorageEngine } from '../services/storageEngine';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openPblModal: () => void;
  openOrderHistory: () => void;
  openConcurrencyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openPblModal,
  openOrderHistory,
  openConcurrencyModal
}) => {
  const { currentUser, switchRole, activeRole } = useAuth();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotification();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setShowRoleMenu(false);
    // Auto switch tab to appropriate view
    if (role === 'customer') {
      setCurrentTab('menu');
    } else if (role === 'kitchen_staff') {
      setCurrentTab('kitchen_orders');
    } else if (role === 'admin') {
      setCurrentTab('inventory');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all sample orders, inventory stocks, and transactions to fresh defaults?')) {
      StorageEngine.resetAll();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top utility alert bar */}
      <div className="bg-emerald-900 text-emerald-100 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span>College PBL Project • Smart Cafeteria Pre-Order & Inventory Management System</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={openConcurrencyModal}
            className="hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold underline underline-offset-2"
          >
            ⚡ Test Atomic Concurrency
          </button>
          <button 
            onClick={openPblModal}
            className="hover:text-white transition-colors flex items-center gap-1 font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Architecture & Code</span>
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('menu')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-stone-900">SmartBite</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Campus PBL
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">University Commons Pre-Order</p>
            </div>
          </div>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
            {/* Customer Links */}
            <button
              onClick={() => setCurrentTab('menu')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'menu'
                  ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Food Menu
            </button>

            <button
              onClick={() => setCurrentTab('tracker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'tracker'
                  ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Live Order Tracker
            </button>

            {/* Kitchen Staff & Admin Tab */}
            {(activeRole === 'kitchen_staff' || activeRole === 'admin') && (
              <button
                onClick={() => setCurrentTab('kitchen_orders')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentTab === 'kitchen_orders'
                    ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Kitchen Board</span>
              </button>
            )}

            {/* Admin Management Tabs */}
            {activeRole === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('inventory')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'inventory'
                      ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Inventory Control</span>
                </button>

                <button
                  onClick={() => setCurrentTab('menu_admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'menu_admin'
                      ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Menu Recipes
                </button>

                <button
                  onClick={() => setCurrentTab('reports')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'reports'
                      ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/60'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Analytics & Reports
                </button>
              </>
            )}
          </nav>

          {/* Right actions: Role switcher, Notifications, Cart */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeRole === 'admin'
                    ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                    : activeRole === 'kitchen_staff'
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Switch Role for Evaluation"
              >
                {activeRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />}
                {activeRole === 'kitchen_staff' && <ChefHat className="w-3.5 h-3.5 text-amber-700" />}
                {activeRole === 'customer' && <UserCircle className="w-3.5 h-3.5 text-emerald-700" />}
                <span className="capitalize">{currentUser.fullName.split(' ')[0]}</span>
                <span className="text-[10px] uppercase font-bold opacity-75">
                  ({activeRole === 'kitchen_staff' ? 'Staff' : activeRole})
                </span>
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Switch Active User Role
                  </div>

                  <button
                    onClick={() => handleRoleSelect('customer')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      activeRole === 'customer' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Alex Chen (Student)</div>
                      <div className="text-[10px] text-stone-500">Customer Pre-Orders & Tracking</div>
                    </div>
                    {activeRole === 'customer' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('kitchen_staff')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      activeRole === 'kitchen_staff' ? 'bg-amber-50 text-amber-800 font-bold' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Chef Mario Rossi</div>
                      <div className="text-[10px] text-stone-500">Live Kitchen Prep & Pickup Codes</div>
                    </div>
                    {activeRole === 'kitchen_staff' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      activeRole === 'admin' ? 'bg-purple-50 text-purple-800 font-bold' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Elena Vance (Manager)</div>
                      <div className="text-[10px] text-stone-500">Inventory, Recipes & Analytics</div>
                    </div>
                    {activeRole === 'admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </button>

                  <div className="mt-2 pt-2 border-t border-stone-100 px-2">
                    <button
                      onClick={handleResetData}
                      className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-stone-500 hover:text-red-600 flex items-center gap-1.5 rounded-lg hover:bg-red-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Sample Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Notifications</span>
                    <div className="flex gap-2 text-[10px]">
                      <button onClick={markAllAsRead} className="text-emerald-700 font-semibold hover:underline">
                        Mark all read
                      </button>
                      <button onClick={clearAll} className="text-stone-400 hover:text-stone-600">
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-stone-400">No new notifications</div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div key={n.id} className={`p-3 text-xs ${n.isRead ? 'opacity-70' : 'bg-emerald-50/40'}`}>
                          <div className="font-semibold text-stone-900">{n.title}</div>
                          <div className="text-stone-600 text-[11px] mt-0.5">{n.message}</div>
                          <div className="text-[9px] text-stone-400 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="bg-emerald-800 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                  {itemCount}
                </span>
              )}
              {subtotal > 0 && (
                <span className="hidden sm:inline font-mono font-medium opacity-90 pl-1 border-l border-emerald-500/60">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
