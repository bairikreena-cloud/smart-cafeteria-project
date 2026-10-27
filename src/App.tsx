import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { StorageEngine, wsBus } from './services/storageEngine';
import { MenuItem, Ingredient, Order, InventoryTransaction } from './types';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MenuCatalog } from './components/customer/MenuCatalog';
import { ItemDetailModal } from './components/customer/ItemDetailModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderConfirmationModal } from './components/customer/OrderConfirmationModal';
import { LiveOrderTracker } from './components/customer/LiveOrderTracker';
import { OrderHistoryModal } from './components/customer/OrderHistoryModal';

import { KitchenOrdersBoard } from './components/staff/KitchenOrdersBoard';
import { InventoryManager } from './components/admin/InventoryManager';
import { MenuManager } from './components/admin/MenuManager';
import { ReportsAnalytics } from './components/admin/ReportsAnalytics';

import { ConcurrencyTestModal } from './components/pbl/ConcurrencyTestModal';
import { ProjectDocumentationModal } from './components/pbl/ProjectDocumentationModal';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { activeToast, dismissToast } = useNotification();

  // App dataset states loaded from persistent storage engine
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => StorageEngine.getMenuItems());
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => StorageEngine.getIngredients());
  const [orders, setOrders] = useState<Order[]>(() => StorageEngine.getOrders());
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => StorageEngine.getTransactions());

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('menu');

  // Modals
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [isPblModalOpen, setIsPblModalOpen] = useState(false);

  const refreshData = () => {
    setMenuItems(StorageEngine.getMenuItems());
    setIngredients(StorageEngine.getIngredients());
    setOrders(StorageEngine.getOrders());
    setTransactions(StorageEngine.getTransactions());
  };

  // Subscribe to real-time events from WebSocket bus
  useEffect(() => {
    const unsubAll = wsBus.subscribe('*', () => {
      refreshData();
    });
    return () => unsubAll();
  }, []);

  const handleOrderSuccess = (newOrder: Order) => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(newOrder);
    refreshData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-stone-800">
      
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openPblModal={() => setIsPblModalOpen(true)}
        openOrderHistory={() => setIsOrderHistoryOpen(true)}
        openConcurrencyModal={() => setIsConcurrencyModalOpen(true)}
      />

      {/* Floating Toast Notification Alert */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-start gap-3 max-w-sm">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              {activeToast.type === 'inventory' ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs">{activeToast.title}</div>
              <div className="text-[11px] text-stone-300 mt-0.5 leading-snug">{activeToast.message}</div>
            </div>
            <button onClick={dismissToast} className="text-stone-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Render View based on Current Tab and Role */}
        
        {/* Customer View: Food Menu */}
        {currentTab === 'menu' && (
          <MenuCatalog
            menuItems={menuItems}
            onSelectItem={item => setSelectedMenuItem(item)}
          />
        )}

        {/* Customer View: Live Order Tracker */}
        {currentTab === 'tracker' && (
          <LiveOrderTracker
            orders={orders}
            onRefreshOrders={refreshData}
            openOrderHistory={() => setIsOrderHistoryOpen(true)}
          />
        )}

        {/* Kitchen Staff & Admin: Order Expeditor Kanban Board */}
        {currentTab === 'kitchen_orders' && (
          <KitchenOrdersBoard
            orders={orders}
            onRefreshOrders={refreshData}
          />
        )}

        {/* Admin: Inventory & Stock Control */}
        {currentTab === 'inventory' && (
          <InventoryManager
            ingredients={ingredients}
            transactions={transactions}
            onRefreshData={refreshData}
          />
        )}

        {/* Admin: Menu Dishes & Recipe Spec Manager */}
        {currentTab === 'menu_admin' && (
          <MenuManager
            menuItems={menuItems}
            ingredients={ingredients}
            onRefreshData={refreshData}
          />
        )}

        {/* Admin: Reports, Volume & Sales Analytics */}
        {currentTab === 'reports' && (
          <ReportsAnalytics
            orders={orders}
            ingredients={ingredients}
            transactions={transactions}
            menuItems={menuItems}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        openPblModal={() => setIsPblModalOpen(true)}
        openConcurrencyModal={() => setIsConcurrencyModalOpen(true)}
      />

      {/* Modals & Slide-Overs */}
      <ItemDetailModal
        item={selectedMenuItem}
        onClose={() => setSelectedMenuItem(null)}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewTracker={() => {
          setConfirmedOrder(null);
          setCurrentTab('tracker');
        }}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        orders={orders}
      />

      <ConcurrencyTestModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        menuItems={menuItems}
        onRefreshData={refreshData}
      />

      <ProjectDocumentationModal
        isOpen={isPblModalOpen}
        onClose={() => setIsPblModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
