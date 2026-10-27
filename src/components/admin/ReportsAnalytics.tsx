import React, { useMemo } from 'react';
import { 
  BarChart3, Download, TrendingUp, DollarSign, 
  ShoppingBag, Trash2, Calendar, FileSpreadsheet, CheckCircle2 
} from 'lucide-react';
import { Order, Ingredient, InventoryTransaction, MenuItem } from '../../types';

interface ReportsAnalyticsProps {
  orders: Order[];
  ingredients: Ingredient[];
  transactions: InventoryTransaction[];
  menuItems: MenuItem[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  orders,
  ingredients,
  transactions,
  menuItems
}) => {
  // Compute analytics from actual stored orders
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'collected').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;
    const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)).length;

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const averageOrderValue = totalOrders > 0 ? (totalRevenue / (totalOrders - cancelledOrders || 1)) : 0;

    // Item sales breakdown
    const itemSales: { [name: string]: { qty: number; revenue: number } } = {};
    for (const ord of orders) {
      if (ord.status === 'cancelled' || ord.status === 'rejected') continue;
      for (const item of ord.items) {
        if (!itemSales[item.menuItemName]) {
          itemSales[item.menuItemName] = { qty: 0, revenue: 0 };
        }
        itemSales[item.menuItemName].qty += item.quantity;
        itemSales[item.menuItemName].revenue += item.subtotal;
      }
    }

    const sortedTopItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty);

    // Wastage transactions
    const wasteTxs = transactions.filter(t => t.transactionType === 'waste_spoilage');
    const totalWasteUnits = wasteTxs.reduce((acc, t) => acc + Math.abs(t.quantityChange), 0);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      totalRevenue,
      averageOrderValue,
      topItems: sortedTopItems,
      wasteCount: wasteTxs.length,
      totalWasteUnits
    };
  }, [orders, transactions]);

  // CSV Export utility
  const exportCSV = (type: 'sales' | 'inventory' | 'waste') => {
    let csvContent = '';
    let fileName = '';

    if (type === 'sales') {
      csvContent = 'Order Number,Date,Customer Name,Status,Total ($),Tax ($),Payment Method\n';
      orders.forEach(o => {
        csvContent += `"${o.orderNumber}","${o.createdAt}","${o.customerName}","${o.status}",${o.totalAmount},${o.taxAmount},"${o.paymentMethod}"\n`;
      });
      fileName = `smart_cafeteria_sales_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'inventory') {
      csvContent = 'Ingredient Name,Category,Physical Stock,Reserved Stock,Available Stock,Unit,Min Threshold,Expiry Date\n';
      ingredients.forEach(i => {
        csvContent += `"${i.name}","${i.category}",${i.currentStock},${i.reservedStock},${i.availableStock},"${i.unit}",${i.minimumThreshold},"${i.expiryDate || 'N/A'}"\n`;
      });
      fileName = `smart_cafeteria_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'waste') {
      csvContent = 'Date,Ingredient,Quantity Lost,Reason,Balance After\n';
      transactions
        .filter(t => t.transactionType === 'waste_spoilage')
        .forEach(t => {
          csvContent += `"${t.createdAt}","${t.ingredientName}",${Math.abs(t.quantityChange)},"${t.reason}",${t.balanceAfter}\n`;
        });
      fileName = `smart_cafeteria_waste_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & CSV Export Bar */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Cafeteria Sales, Volume & Inventory Analytics</span>
          </h2>
          <p className="text-xs text-stone-500">
            Real data generated directly from live pre-orders, kitchen receipts, and ingredient logs.
          </p>
        </div>

        {/* CSV Export Dropdown / Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCSV('sales')}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Sales (CSV)</span>
          </button>

          <button
            onClick={() => exportCSV('inventory')}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Stock (CSV)</span>
          </button>

          <button
            onClick={() => exportCSV('waste')}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-red-600" />
            <span>Export Waste (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Total Sales Revenue</span>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500">Across valid pre-orders</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Total Pre-Orders</span>
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {stats.totalOrders} Placed
          </div>
          <div className="text-[11px] text-stone-500">{stats.completedOrders} completed • {stats.activeOrders} active</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Average Order Value</span>
          </div>
          <div className="text-2xl font-black text-purple-900 font-mono">
            ${stats.averageOrderValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500">Per customer checkout</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Recorded Spoilage / Waste</span>
          </div>
          <div className="text-2xl font-black text-red-900 font-mono">
            {stats.totalWasteUnits.toFixed(1)} Units
          </div>
          <div className="text-[11px] text-stone-500">From {stats.wasteCount} logged incidents</div>
        </div>
      </div>

      {/* Popular Items & Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Items */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Top Performing Menu Dishes</span>
          </h3>

          <div className="space-y-3">
            {stats.topItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">No dish sales recorded yet.</div>
            ) : (
              stats.topItems.map((item, idx) => {
                const maxSold = Math.max(...stats.topItems.map(t => t.qty), 1);
                const pct = Math.round((item.qty / maxSold) * 100);

                return (
                  <div key={item.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-stone-800">
                        #{idx + 1} {item.name}
                      </span>
                      <span className="font-mono text-emerald-800 font-bold">
                        {item.qty} portions (${item.revenue.toFixed(2)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Order Pipeline & Fulfillment Status</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Collected & Completed</span>
              <span className="font-mono text-2xl font-black text-emerald-900">{stats.completedOrders}</span>
              <span className="text-[10px] text-emerald-600 block">Verified via 4-digit code</span>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Active In Kitchen</span>
              <span className="font-mono text-2xl font-black text-blue-900">{stats.activeOrders}</span>
              <span className="text-[10px] text-blue-600 block">Pending, cooking, or ready</span>
            </div>

            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Cancelled / Rejected</span>
              <span className="font-mono text-2xl font-black text-red-900">{stats.cancelledOrders}</span>
              <span className="text-[10px] text-red-600 block">Ingredients released to stock</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-600 block">Total Database Orders</span>
              <span className="font-mono text-2xl font-black text-stone-900">{stats.totalOrders}</span>
              <span className="text-[10px] text-stone-500 block">Full transaction audit trail</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
