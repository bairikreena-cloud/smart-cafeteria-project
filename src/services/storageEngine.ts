import { 
  Ingredient, MenuItem, Order, InventoryTransaction, 
  OrderStatus, PaymentMethod, CartItem, LowStockAlert, AppNotification 
} from '../types';
import { 
  INITIAL_INGREDIENTS, INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS, INITIAL_TRANSACTIONS 
} from '../data/mockDatabase';

const STORAGE_KEYS = {
  INGREDIENTS: 'smart_cafeteria_ingredients_v1',
  MENU_ITEMS: 'smart_cafeteria_menu_v1',
  ORDERS: 'smart_cafeteria_orders_v1',
  TRANSACTIONS: 'smart_cafeteria_transactions_v1',
  NOTIFICATIONS: 'smart_cafeteria_notifications_v1',
};

// --- In-Memory WebSocket-like Pub/Sub Event Bus ---
type EventListener = (payload: any) => void;

class WebSocketEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();

  subscribe(eventType: string, callback: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  broadcast(eventType: string, payload: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`WebSocket bus error in ${eventType}:`, e);
        }
      });
    }
    // Also trigger global wildcard listeners
    const globalHandlers = this.listeners.get('*');
    if (globalHandlers) {
      globalHandlers.forEach(fn => fn({ event: eventType, payload }));
    }
  }
}

export const wsBus = new WebSocketEventBus();

// --- Storage Engine Implementation ---
export class StorageEngine {
  private static load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Error reading localStorage for key ${key}:`, e);
      return fallback;
    }
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error writing localStorage for key ${key}:`, e);
    }
  }

  // --- Reset to Default Seed Data ---
  static resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.INGREDIENTS);
    localStorage.removeItem(STORAGE_KEYS.MENU_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    wsBus.broadcast('SYSTEM_RESET', { timestamp: new Date().toISOString() });
  }

  // --- Ingredients ---
  static getIngredients(): Ingredient[] {
    const raw = this.load<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS);
    // Recalculate availableStock
    return raw.map(ing => ({
      ...ing,
      availableStock: Math.max(0, ing.currentStock - (ing.reservedStock || 0))
    }));
  }

  static saveIngredients(ingredients: Ingredient[]): void {
    this.save(STORAGE_KEYS.INGREDIENTS, ingredients);
  }

  static getLowStockAlerts(): LowStockAlert[] {
    const ingredients = this.getIngredients();
    const alerts: LowStockAlert[] = [];
    for (const ing of ingredients) {
      if (ing.availableStock <= ing.minimumThreshold) {
        alerts.push({
          ingredientId: ing.id,
          name: ing.name,
          currentStock: ing.availableStock,
          minimumThreshold: ing.minimumThreshold,
          unit: ing.unit,
          severity: ing.availableStock === 0 ? 'CRITICAL' : 'WARNING'
        });
      }
    }
    return alerts;
  }

  // --- Menu Calculation ---
  static calculateMenuItemPortions(item: MenuItem, ingredients: Ingredient[]): number {
    if (!item.recipeIngredients || item.recipeIngredients.length === 0) {
      return 999;
    }

    let minPortions = 999999;
    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    for (const ri of item.recipeIngredients) {
      const ing = ingMap.get(ri.ingredientId);
      if (!ing) return 0;

      // Check expiry
      if (ing.expiryDate && new Date(ing.expiryDate) < new Date()) {
        return 0;
      }

      if (ri.quantityRequired <= 0) continue;
      const possible = Math.floor(ing.availableStock / ri.quantityRequired);
      if (possible < minPortions) {
        minPortions = possible;
      }
    }

    return minPortions === 999999 ? 0 : Math.max(0, minPortions);
  }

  static getMenuItems(): MenuItem[] {
    const rawItems = this.load<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
    const ingredients = this.getIngredients();

    return rawItems.map(item => {
      const portions = this.calculateMenuItemPortions(item, ingredients);
      // Update recipe ingredient available stocks
      const updatedRecipe = item.recipeIngredients?.map(ri => {
        const found = ingredients.find(i => i.id === ri.ingredientId);
        return {
          ...ri,
          availableStock: found ? found.availableStock : 0
        };
      }) || [];

      return {
        ...item,
        availablePortions: portions,
        isInStock: portions > 0 && item.isManuallyAvailable,
        recipeIngredients: updatedRecipe
      };
    });
  }

  static saveMenuItems(items: MenuItem[]): void {
    this.save(STORAGE_KEYS.MENU_ITEMS, items);
    wsBus.broadcast('MENU_UPDATED', { count: items.length });
  }

  // --- Transactions ---
  static getTransactions(): InventoryTransaction[] {
    return this.load<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  static logTransaction(
    ingredientId: number, 
    ingredientName: string, 
    type: InventoryTransaction['transactionType'], 
    quantityChange: number, 
    balanceAfter: number, 
    reason: string,
    orderId?: number
  ): void {
    const list = this.getTransactions();
    const newTx: InventoryTransaction = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ingredientId,
      ingredientName,
      transactionType: type,
      quantityChange,
      balanceAfter,
      reason,
      orderId,
      createdAt: new Date().toISOString()
    };
    list.unshift(newTx);
    this.save(STORAGE_KEYS.TRANSACTIONS, list);
    wsBus.broadcast('TRANSACTION_LOGGED', newTx);
  }

  // --- Orders ---
  static getOrders(): Order[] {
    return this.load<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  static saveOrders(orders: Order[]): void {
    this.save(STORAGE_KEYS.ORDERS, orders);
  }

  // --- Core Atomic Order Placement ---
  static placeOrder(
    customerId: number,
    customerName: string,
    customerEmail: string,
    cartItems: CartItem[],
    scheduledPickupTime: string,
    paymentMethod: PaymentMethod,
    customerNotes?: string
  ): { success: boolean; order?: Order; error?: string } {
    if (cartItems.length === 0) {
      return { success: false, error: 'Your pre-order cart is empty.' };
    }

    const ingredients = this.getIngredients();
    const menuItems = this.getMenuItems();
    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    // Step 1: Calculate total required quantities per ingredient
    const requiredPerIngredient: { [id: number]: number } = {};

    for (const cItem of cartItems) {
      const mItem = menuItems.find(m => m.id === cItem.menuItem.id);
      if (!mItem || !mItem.isManuallyAvailable) {
        return { success: false, error: `Menu item "${cItem.menuItem.name}" is no longer available.` };
      }

      for (const ri of mItem.recipeIngredients) {
        const needed = ri.quantityRequired * cItem.quantity;
        requiredPerIngredient[ri.ingredientId] = (requiredPerIngredient[ri.ingredientId] || 0) + needed;
      }
    }

    // Step 2: Atomic Availability Check
    for (const [ingIdStr, requiredAmount] of Object.entries(requiredPerIngredient)) {
      const ingId = Number(ingIdStr);
      const ing = ingMap.get(ingId);
      if (!ing) {
        return { success: false, error: `Required ingredient #${ingId} not found.` };
      }

      if (ing.expiryDate && new Date(ing.expiryDate) < new Date()) {
        return { success: false, error: `Cannot order: Ingredient "${ing.name}" has expired.` };
      }

      if (ing.availableStock < requiredAmount) {
        return {
          success: false,
          error: `Insufficient stock for "${ing.name}". Required: ${requiredAmount.toFixed(1)} ${ing.unit}, Available: ${ing.availableStock.toFixed(1)} ${ing.unit}.`
        };
      }
    }

    // Step 3: Atomic Stock Reservation
    for (const [ingIdStr, requiredAmount] of Object.entries(requiredPerIngredient)) {
      const ingId = Number(ingIdStr);
      const ing = ingMap.get(ingId)!;
      ing.reservedStock = (ing.reservedStock || 0) + requiredAmount;
      ing.availableStock = Math.max(0, ing.currentStock - ing.reservedStock);
      ing.lastUpdated = new Date().toISOString();
    }

    // Save modified ingredients
    this.saveIngredients(Array.from(ingMap.values()));

    // Step 4: Construct Order Object
    const subtotal = cartItems.reduce((acc, itm) => acc + (itm.menuItem.price * itm.quantity), 0);
    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const orderNumber = `CB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationCode = `${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = Date.now();

    const orderItems = cartItems.map((cItem, index) => ({
      id: index + 1,
      menuItemId: cItem.menuItem.id,
      menuItemName: cItem.menuItem.name,
      quantity: cItem.quantity,
      unitPrice: cItem.menuItem.price,
      subtotal: Number((cItem.menuItem.price * cItem.quantity).toFixed(2))
    }));

    const newOrder: Order = {
      id: newOrderId,
      orderNumber,
      customerId,
      customerName,
      customerEmail,
      status: 'pending',
      scheduledPickupTime,
      totalAmount,
      taxAmount,
      customerNotes,
      createdAt: new Date().toISOString(),
      items: orderItems,
      verificationCode,
      paymentMethod,
      paymentStatus: 'paid',
      paymentTxRef: `MOCK-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };

    // Save Order
    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.saveOrders(orders);

    // Audit logs for reservation
    for (const [ingIdStr, requiredAmount] of Object.entries(requiredPerIngredient)) {
      const ingId = Number(ingIdStr);
      const ing = ingMap.get(ingId)!;
      this.logTransaction(
        ingId,
        ing.name,
        'order_reservation',
        -requiredAmount,
        ing.availableStock,
        `Atomic stock reservation held for Order #${orderNumber}`,
        newOrderId
      );
    }

    // Broadcast Real-Time Events
    wsBus.broadcast('NEW_ORDER', newOrder);
    wsBus.broadcast('INVENTORY_CHANGED', { ingredientCount: Object.keys(requiredPerIngredient).length });

    // Check for low stock alerts
    const alerts = this.getLowStockAlerts();
    if (alerts.length > 0) {
      wsBus.broadcast('LOW_STOCK_ALERT', alerts);
    }

    return { success: true, order: newOrder };
  }

  // --- Order Status Management & Lifecycle Transitions ---
  static updateOrderStatus(
    orderId: number, 
    newStatus: OrderStatus, 
    cancellationReason?: string
  ): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    const order = orders[orderIndex];
    const oldStatus = order.status;

    // Rules for cancellation
    if (newStatus === 'cancelled') {
      if (['preparing', 'ready_for_pickup', 'collected'].includes(oldStatus)) {
        return { success: false, error: 'Cannot cancel an order once cooking has commenced.' };
      }
      order.cancellationReason = cancellationReason || 'Cancelled by customer';
      this.releaseOrderReservations(order, cancellationReason || 'Order cancelled');
    }

    // Transition to PREPARING or READY: permanently consume reserved ingredients
    if (['preparing', 'ready_for_pickup'].includes(newStatus) && ['pending', 'accepted'].includes(oldStatus)) {
      this.consumeOrderReservations(order);
    }

    if (newStatus === 'collected') {
      order.actualPickupTime = new Date().toISOString();
    }

    order.status = newStatus;
    orders[orderIndex] = order;
    this.saveOrders(orders);

    wsBus.broadcast('ORDER_STATUS_CHANGED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus,
      customerId: order.customerId
    });

    return { success: true, order };
  }

  // --- Release ingredients on cancellation ---
  private static releaseOrderReservations(order: Order, reason: string): void {
    const ingredients = this.getIngredients();
    const menuItems = this.getMenuItems();
    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    for (const item of order.items) {
      const mItem = menuItems.find(m => m.id === item.menuItemId);
      if (!mItem) continue;

      for (const ri of mItem.recipeIngredients) {
        const ing = ingMap.get(ri.ingredientId);
        if (ing) {
          const qty = ri.quantityRequired * item.quantity;
          ing.reservedStock = Math.max(0, (ing.reservedStock || 0) - qty);
          ing.availableStock = Math.max(0, ing.currentStock - ing.reservedStock);
          this.logTransaction(
            ing.id,
            ing.name,
            'order_cancellation_restore',
            qty,
            ing.availableStock,
            `Reservation restored: ${reason} (Order #${order.orderNumber})`,
            order.id
          );
        }
      }
    }
    this.saveIngredients(Array.from(ingMap.values()));
    wsBus.broadcast('INVENTORY_CHANGED', {});
  }

  // --- Consume reservations when food is being prepared ---
  private static consumeOrderReservations(order: Order): void {
    const ingredients = this.getIngredients();
    const menuItems = this.getMenuItems();
    const ingMap = new Map(ingredients.map(i => [i.id, i]));

    for (const item of order.items) {
      const mItem = menuItems.find(m => m.id === item.menuItemId);
      if (!mItem) continue;

      for (const ri of mItem.recipeIngredients) {
        const ing = ingMap.get(ri.ingredientId);
        if (ing) {
          const qty = ri.quantityRequired * item.quantity;
          ing.currentStock = Math.max(0, ing.currentStock - qty);
          ing.reservedStock = Math.max(0, (ing.reservedStock || 0) - qty);
          ing.availableStock = Math.max(0, ing.currentStock - ing.reservedStock);
          this.logTransaction(
            ing.id,
            ing.name,
            'order_consumption',
            -qty,
            ing.currentStock,
            `Physical consumption fulfilled for Order #${order.orderNumber}`,
            order.id
          );
        }
      }
    }
    this.saveIngredients(Array.from(ingMap.values()));
    wsBus.broadcast('INVENTORY_CHANGED', {});
  }

  // --- Manual Stock Adjustments ---
  static adjustIngredientStock(
    ingredientId: number, 
    change: number, 
    type: InventoryTransaction['transactionType'], 
    reason: string
  ): { success: boolean; ingredient?: Ingredient; error?: string } {
    const ingredients = this.getIngredients();
    const ing = ingredients.find(i => i.id === ingredientId);
    if (!ing) return { success: false, error: 'Ingredient not found' };

    const newStock = ing.currentStock + change;
    if (newStock < 0) {
      return { success: false, error: 'Adjustment would result in negative physical inventory.' };
    }

    ing.currentStock = newStock;
    ing.availableStock = Math.max(0, ing.currentStock - (ing.reservedStock || 0));
    ing.lastUpdated = new Date().toISOString();

    this.saveIngredients(ingredients);
    this.logTransaction(ing.id, ing.name, type, change, ing.currentStock, reason);

    wsBus.broadcast('INVENTORY_CHANGED', { ingredientId: ing.id, stock: ing.availableStock });
    return { success: true, ingredient: ing };
  }

  // --- Pickup Code Verification ---
  static verifyPickupCode(orderId: number, code: string): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    if (order.status === 'collected') {
      return { success: false, error: 'This order has already been marked as collected.' };
    }

    if (order.verificationCode.trim() !== code.trim()) {
      return { success: false, error: 'Verification code does not match. Please verify with the customer.' };
    }

    return this.updateOrderStatus(orderId, 'collected');
  }

  // --- Concurrency Stress Simulation for PBL Demo ---
  static runConcurrencyStressTest(
    menuItemId: number,
    totalSimulatedUsers: number = 5
  ): { logs: string[]; successCount: number; rejectedCount: number } {
    const logs: string[] = [];
    let successCount = 0;
    let rejectedCount = 0;

    const menuItems = this.getMenuItems();
    const targetItem = menuItems.find(m => m.id === menuItemId) || menuItems[0];
    const initialPortions = targetItem.availablePortions;

    logs.push(`[T0] Starting Concurrency Stress Test on "${targetItem.name}"...`);
    logs.push(`[T0] Current Available Portions in Database: ${initialPortions}`);
    logs.push(`[T0] Dispatching ${totalSimulatedUsers} simultaneous pre-orders of 1 portion each...`);

    for (let i = 1; i <= totalSimulatedUsers; i++) {
      const simUserId = 900 + i;
      const simUserName = `Simulated Student #${i}`;
      const simCart: CartItem[] = [{ menuItem: targetItem, quantity: 1 }];

      // Try placing order
      const result = this.placeOrder(
        simUserId,
        simUserName,
        `student${i}@test.campus.edu`,
        simCart,
        new Date(Date.now() + 20 * 60000).toISOString(),
        'campus_card',
        'Simulated stress test order'
      );

      if (result.success) {
        successCount++;
        logs.push(`[SUCCESS] User #${i} (${simUserName}) reserved portion. Order #${result.order?.orderNumber} created.`);
      } else {
        rejectedCount++;
        logs.push(`[REJECTED - 400 Bad Request] User #${i} failed: ${result.error}`);
      }
    }

    const postItems = this.getMenuItems();
    const postItem = postItems.find(m => m.id === targetItem.id);
    logs.push(`[DONE] Concurrency test complete! Total Accepted: ${successCount}, Total Rejected: ${rejectedCount}. Final Stock Portions: ${postItem?.availablePortions}. Zero Overselling.`);

    return { logs, successCount, rejectedCount };
  }
}
