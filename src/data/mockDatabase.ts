import { User, Ingredient, MenuItem, Order, InventoryTransaction } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    fullName: "Alex Chen (Student)",
    email: "alex.student@campus.edu",
    role: "customer",
    studentStaffId: "STU-2024-883",
    phoneNumber: "+1 (555) 234-5678",
    isActive: true,
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: 2,
    fullName: "Chef Mario Rossi",
    email: "chef.mario@campus.edu",
    role: "kitchen_staff",
    studentStaffId: "STF-KITCHEN-01",
    phoneNumber: "+1 (555) 890-1234",
    isActive: true,
    createdAt: "2026-08-15T09:00:00Z"
  },
  {
    id: 3,
    fullName: "Elena Vance (Manager)",
    email: "admin@campus.edu",
    role: "admin",
    studentStaffId: "MGR-001",
    phoneNumber: "+1 (555) 999-0001",
    isActive: true,
    createdAt: "2026-08-01T07:30:00Z"
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 1,
    name: "Artisan Sourdough Bread",
    category: "Bakery",
    unit: "slices",
    currentStock: 60.0,
    reservedStock: 0.0,
    availableStock: 60.0,
    minimumThreshold: 20.0,
    costPerUnit: 0.40,
    expiryDate: "2026-11-05",
    supplierInfo: "Campus Artisan Bakery Co.",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 2,
    name: "Aged Cheddar Cheese",
    category: "Dairy",
    unit: "slices",
    currentStock: 48.0,
    reservedStock: 0.0,
    availableStock: 48.0,
    minimumThreshold: 15.0,
    costPerUnit: 0.50,
    expiryDate: "2026-11-18",
    supplierInfo: "Valley Dairy Farms",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 3,
    name: "Seasoned Chicken Breast",
    category: "Protein",
    unit: "portions",
    currentStock: 26.0,
    reservedStock: 0.0,
    availableStock: 26.0,
    minimumThreshold: 10.0,
    costPerUnit: 2.20,
    expiryDate: "2026-10-30",
    supplierInfo: "GreenPastures Poultry",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 4,
    name: "Roma Tomatoes",
    category: "Produce",
    unit: "units",
    currentStock: 35.0,
    reservedStock: 0.0,
    availableStock: 35.0,
    minimumThreshold: 12.0,
    costPerUnit: 0.35,
    expiryDate: "2026-11-02",
    supplierInfo: "Local Organic Harvest",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 5,
    name: "Crisp Romaine Lettuce",
    category: "Produce",
    unit: "leaves",
    currentStock: 70.0,
    reservedStock: 0.0,
    availableStock: 70.0,
    minimumThreshold: 25.0,
    costPerUnit: 0.15,
    expiryDate: "2026-10-31",
    supplierInfo: "Local Organic Harvest",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 6,
    name: "Herbed Garlic Mayo",
    category: "Pantry",
    unit: "portions",
    currentStock: 50.0,
    reservedStock: 0.0,
    availableStock: 50.0,
    minimumThreshold: 15.0,
    costPerUnit: 0.25,
    expiryDate: "2026-12-10",
    supplierInfo: "Condiments Direct",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 7,
    name: "Whole Wheat Tortilla",
    category: "Bakery",
    unit: "units",
    currentStock: 30.0,
    reservedStock: 0.0,
    availableStock: 30.0,
    minimumThreshold: 12.0,
    costPerUnit: 0.45,
    expiryDate: "2026-11-12",
    supplierInfo: "Metro Foods",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 8,
    name: "Fresh Hass Avocado",
    category: "Produce",
    unit: "units",
    currentStock: 18.0,
    reservedStock: 0.0,
    availableStock: 18.0,
    minimumThreshold: 8.0,
    costPerUnit: 1.10,
    expiryDate: "2026-10-29",
    supplierInfo: "Sunshine Fruit Imports",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 9,
    name: "Farm Fresh Eggs",
    category: "Protein",
    unit: "units",
    currentStock: 45.0,
    reservedStock: 0.0,
    availableStock: 45.0,
    minimumThreshold: 15.0,
    costPerUnit: 0.30,
    expiryDate: "2026-11-20",
    supplierInfo: "Valley Farm Fresh",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 10,
    name: "Greek Strained Yogurt",
    category: "Dairy",
    unit: "grams",
    currentStock: 1800.0,
    reservedStock: 0.0,
    availableStock: 1800.0,
    minimumThreshold: 500.0,
    costPerUnit: 0.012,
    expiryDate: "2026-11-08",
    supplierInfo: "Alpine Dairy Co.",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 11,
    name: "Mixed Forest Berries",
    category: "Produce",
    unit: "grams",
    currentStock: 950.0,
    reservedStock: 0.0,
    availableStock: 950.0,
    minimumThreshold: 300.0,
    costPerUnit: 0.025,
    expiryDate: "2026-10-29",
    supplierInfo: "Berry Fields Organics",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 12,
    name: "House Roasted Granola",
    category: "Bakery",
    unit: "grams",
    currentStock: 1400.0,
    reservedStock: 0.0,
    availableStock: 1400.0,
    minimumThreshold: 400.0,
    costPerUnit: 0.015,
    expiryDate: "2026-12-15",
    supplierInfo: "In-House Prep Batch",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 13,
    name: "Cold Brew Concentrate",
    category: "Beverage",
    unit: "ml",
    currentStock: 4000.0,
    reservedStock: 0.0,
    availableStock: 4000.0,
    minimumThreshold: 1000.0,
    costPerUnit: 0.02,
    expiryDate: "2026-11-15",
    supplierInfo: "Artisan Coffee Roasters",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 14,
    name: "Barista Oat Milk",
    category: "Dairy",
    unit: "ml",
    currentStock: 6500.0,
    reservedStock: 0.0,
    availableStock: 6500.0,
    minimumThreshold: 1500.0,
    costPerUnit: 0.005,
    expiryDate: "2026-11-25",
    supplierInfo: "OatStream Labs",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 15,
    name: "Vanilla Bean Syrup",
    category: "Beverage",
    unit: "ml",
    currentStock: 1100.0,
    reservedStock: 0.0,
    availableStock: 1100.0,
    minimumThreshold: 300.0,
    costPerUnit: 0.018,
    expiryDate: "2027-01-10",
    supplierInfo: "FlavorCraft Organics",
    lastUpdated: "2026-10-26T06:00:00Z"
  },
  {
    id: 16,
    name: "Organic Tricolor Quinoa",
    category: "Pantry",
    unit: "grams",
    currentStock: 2400.0,
    reservedStock: 0.0,
    availableStock: 2400.0,
    minimumThreshold: 600.0,
    costPerUnit: 0.01,
    expiryDate: "2027-02-15",
    supplierInfo: "Global Grains Depot",
    lastUpdated: "2026-10-26T06:00:00Z"
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: "Artisan Triple Cheddar Toastie",
    description: "Golden toasted sourdough loaded with melted aged cheddar, herbed garlic glaze, and fresh cracked pepper.",
    category: "Sandwiches & Wraps",
    price: 6.75,
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 8,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: "Dairy, Gluten",
    isManuallyAvailable: true,
    availablePortions: 24,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 1, ingredientName: "Artisan Sourdough Bread", quantityRequired: 2.0, unit: "slices", availableStock: 60.0 },
      { ingredientId: 2, ingredientName: "Aged Cheddar Cheese", quantityRequired: 2.0, unit: "slices", availableStock: 48.0 },
      { ingredientId: 6, ingredientName: "Herbed Garlic Mayo", quantityRequired: 1.0, unit: "portions", availableStock: 50.0 }
    ]
  },
  {
    id: 2,
    name: "Chipotle Chicken & Avocado Wrap",
    description: "Grilled chicken breast, freshly sliced avocado, crisp romaine lettuce, Roma tomatoes, wrapped in whole wheat.",
    category: "Sandwiches & Wraps",
    price: 8.50,
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 10,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    allergens: "Gluten",
    isManuallyAvailable: true,
    availablePortions: 26,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 7, ingredientName: "Whole Wheat Tortilla", quantityRequired: 1.0, unit: "units", availableStock: 30.0 },
      { ingredientId: 3, ingredientName: "Seasoned Chicken Breast", quantityRequired: 1.0, unit: "portions", availableStock: 26.0 },
      { ingredientId: 8, ingredientName: "Fresh Hass Avocado", quantityRequired: 0.5, unit: "units", availableStock: 18.0 },
      { ingredientId: 4, ingredientName: "Roma Tomatoes", quantityRequired: 1.0, unit: "units", availableStock: 35.0 },
      { ingredientId: 5, ingredientName: "Crisp Romaine Lettuce", quantityRequired: 3.0, unit: "leaves", availableStock: 70.0 }
    ]
  },
  {
    id: 3,
    name: "Greek Yogurt & Wild Berry Granola Bowl",
    description: "Rich creamy Greek strained yogurt layered with forest berries, house-baked honey cinnamon granola, and flax.",
    category: "Bowls & Breakfast",
    price: 5.95,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 5,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    allergens: "Dairy, Honey",
    isManuallyAvailable: true,
    availablePortions: 12,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 10, ingredientName: "Greek Strained Yogurt", quantityRequired: 150.0, unit: "grams", availableStock: 1800.0 },
      { ingredientId: 11, ingredientName: "Mixed Forest Berries", quantityRequired: 60.0, unit: "grams", availableStock: 950.0 },
      { ingredientId: 12, ingredientName: "House Roasted Granola", quantityRequired: 40.0, unit: "grams", availableStock: 1400.0 }
    ]
  },
  {
    id: 4,
    name: "Avocado & Poached Egg Power Plate",
    description: "Two farm eggs served over toasted sourdough with smashed Hass avocado, microgreens, and chili flakes.",
    category: "Bowls & Breakfast",
    price: 7.80,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 12,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: "Eggs, Gluten",
    isManuallyAvailable: true,
    availablePortions: 18,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 9, ingredientName: "Farm Fresh Eggs", quantityRequired: 2.0, unit: "units", availableStock: 45.0 },
      { ingredientId: 1, ingredientName: "Artisan Sourdough Bread", quantityRequired: 2.0, unit: "slices", availableStock: 60.0 },
      { ingredientId: 8, ingredientName: "Fresh Hass Avocado", quantityRequired: 1.0, unit: "units", availableStock: 18.0 },
      { ingredientId: 4, ingredientName: "Roma Tomatoes", quantityRequired: 1.0, unit: "units", availableStock: 35.0 }
    ]
  },
  {
    id: 5,
    name: "Cold Brew Vanilla Oat Cloud Latte",
    description: "Slow-steeped cold brew coffee charged with creamy barista oat milk and pure Madagascar vanilla bean syrup.",
    category: "Beverages",
    price: 4.85,
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 4,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    allergens: "Oats",
    isManuallyAvailable: true,
    availablePortions: 33,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 13, ingredientName: "Cold Brew Concentrate", quantityRequired: 120.0, unit: "ml", availableStock: 4000.0 },
      { ingredientId: 14, ingredientName: "Barista Oat Milk", quantityRequired: 180.0, unit: "ml", availableStock: 6500.0 },
      { ingredientId: 15, ingredientName: "Vanilla Bean Syrup", quantityRequired: 25.0, unit: "ml", availableStock: 1100.0 }
    ]
  },
  {
    id: 6,
    name: "Garden Harvest Mediterranean Quinoa Bowl",
    description: "Tricolor fluffy quinoa topped with diced Roma tomatoes, crisp greens, sliced avocado, and lemon vinaigrette.",
    category: "Bowls & Breakfast",
    price: 7.50,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
    prepTimeMinutes: 7,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    allergens: "None",
    isManuallyAvailable: true,
    availablePortions: 20,
    isInStock: true,
    createdAt: "2026-09-01T08:00:00Z",
    recipeIngredients: [
      { ingredientId: 16, ingredientName: "Organic Tricolor Quinoa", quantityRequired: 120.0, unit: "grams", availableStock: 2400.0 },
      { ingredientId: 5, ingredientName: "Crisp Romaine Lettuce", quantityRequired: 4.0, unit: "leaves", availableStock: 70.0 },
      { ingredientId: 4, ingredientName: "Roma Tomatoes", quantityRequired: 1.0, unit: "units", availableStock: 35.0 },
      { ingredientId: 8, ingredientName: "Fresh Hass Avocado", quantityRequired: 0.5, unit: "units", availableStock: 18.0 }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 101,
    orderNumber: "CB-2026-8812",
    customerId: 1,
    customerName: "Alex Chen (Student)",
    customerEmail: "alex.student@campus.edu",
    status: "ready_for_pickup",
    scheduledPickupTime: new Date(Date.now() + 15 * 60000).toISOString(),
    totalAmount: 11.60,
    taxAmount: 0.55,
    customerNotes: "Please keep dressing on the side if possible",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    verificationCode: "7491",
    paymentMethod: "campus_card",
    paymentStatus: "paid",
    paymentTxRef: "MOCK-TXN-CC-991204",
    items: [
      { id: 1, menuItemId: 1, menuItemName: "Artisan Triple Cheddar Toastie", quantity: 1, unitPrice: 6.75, subtotal: 6.75 },
      { id: 2, menuItemId: 5, menuItemName: "Cold Brew Vanilla Oat Cloud Latte", quantity: 1, unitPrice: 4.85, subtotal: 4.85 }
    ]
  },
  {
    id: 102,
    orderNumber: "CB-2026-8815",
    customerId: 1,
    customerName: "Alex Chen (Student)",
    customerEmail: "alex.student@campus.edu",
    status: "preparing",
    scheduledPickupTime: new Date(Date.now() + 30 * 60000).toISOString(),
    totalAmount: 8.92,
    taxAmount: 0.42,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    verificationCode: "3824",
    paymentMethod: "upi",
    paymentStatus: "paid",
    paymentTxRef: "MOCK-TXN-UPI-884910",
    items: [
      { id: 3, menuItemId: 2, menuItemName: "Chipotle Chicken & Avocado Wrap", quantity: 1, unitPrice: 8.50, subtotal: 8.50 }
    ]
  },
  {
    id: 99,
    orderNumber: "CB-2026-8790",
    customerId: 1,
    customerName: "Alex Chen (Student)",
    customerEmail: "alex.student@campus.edu",
    status: "collected",
    scheduledPickupTime: new Date(Date.now() - 120 * 60000).toISOString(),
    actualPickupTime: new Date(Date.now() - 110 * 60000).toISOString(),
    totalAmount: 6.25,
    taxAmount: 0.30,
    createdAt: new Date(Date.now() - 140 * 60000).toISOString(),
    verificationCode: "5128",
    paymentMethod: "campus_card",
    paymentStatus: "paid",
    paymentTxRef: "MOCK-TXN-CC-771802",
    items: [
      { id: 4, menuItemId: 3, menuItemName: "Greek Yogurt & Wild Berry Granola Bowl", quantity: 1, unitPrice: 5.95, subtotal: 5.95 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 1,
    ingredientId: 1,
    ingredientName: "Artisan Sourdough Bread",
    transactionType: "purchase",
    quantityChange: 80.0,
    balanceAfter: 80.0,
    reason: "Fresh morning bakery batch delivery",
    createdAt: "2026-10-26T05:30:00Z"
  },
  {
    id: 2,
    ingredientId: 2,
    ingredientName: "Aged Cheddar Cheese",
    transactionType: "purchase",
    quantityChange: 60.0,
    balanceAfter: 60.0,
    reason: "Weekly refrigerated stock intake",
    createdAt: "2026-10-26T05:35:00Z"
  },
  {
    id: 3,
    ingredientId: 1,
    ingredientName: "Artisan Sourdough Bread",
    orderId: 101,
    transactionType: "order_consumption",
    quantityChange: -2.0,
    balanceAfter: 60.0,
    reason: "Kitchen preparation fulfilled for Order #CB-2026-8812",
    createdAt: "2026-10-26T06:05:00Z"
  }
];
