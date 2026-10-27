export type UserRole = 'customer' | 'kitchen_staff' | 'admin';

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'collected'
  | 'cancelled'
  | 'rejected';

export type PaymentMethod = 'campus_card' | 'upi' | 'cash_counter' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type InventoryTxType = 
  | 'purchase'
  | 'adjustment'
  | 'order_reservation'
  | 'order_consumption'
  | 'order_cancellation_restore'
  | 'waste_spoilage';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  studentStaffId?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Ingredient {
  id: number;
  name: string;
  category: 'Produce' | 'Dairy' | 'Bakery' | 'Protein' | 'Beverage' | 'Pantry';
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumThreshold: number;
  costPerUnit: number;
  expiryDate?: string;
  supplierInfo?: string;
  lastUpdated: string;
}

export interface RecipeIngredientDetail {
  ingredientId: number;
  ingredientName: string;
  quantityRequired: number;
  unit: string;
  availableStock: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  prepTimeMinutes: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens?: string;
  isManuallyAvailable: boolean;
  availablePortions: number;
  isInStock: boolean;
  recipeIngredients: RecipeIngredientDetail[];
  createdAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  scheduledPickupTime: string;
  actualPickupTime?: string;
  totalAmount: number;
  taxAmount: number;
  customerNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  items: OrderItem[];
  verificationCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTxRef: string;
}

export interface InventoryTransaction {
  id: number;
  ingredientId: number;
  ingredientName: string;
  orderId?: number;
  userId?: number;
  transactionType: InventoryTxType;
  quantityChange: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: number;
  title: string;
  message: string;
  type: 'order' | 'kitchen' | 'inventory' | 'system';
  isRead: boolean;
  orderId?: number;
  createdAt: string;
}

export interface LowStockAlert {
  ingredientId: number;
  name: string;
  currentStock: number;
  minimumThreshold: number;
  unit: string;
  severity: 'CRITICAL' | 'WARNING';
}
