// Mock catalog. Replace with API calls (GET /api/restaurants etc.) when the backend exists.

export const categories = [
  { id: 'pizza', name: 'Pizza', color: '#dc2626' },
  { id: 'biryani', name: 'Biryani', color: '#a16207' },
  { id: 'burger', name: 'Burgers', color: '#b45309' },
  { id: 'south', name: 'South Indian', color: '#15803d' },
  { id: 'chinese', name: 'Chinese', color: '#be123c' },
  { id: 'dessert', name: 'Desserts', color: '#9d174d' },
];

export const restaurants = [
  { id: 'r1', name: 'Tandoor Tales', cuisine: ['Biryani', 'North Indian'], category: 'biryani', rating: 4.5, eta: 30, fee: 30, priceFor2: 500, area: 'Cantonment', open: true, veg: false, approval: 'approved', color: '#a16207' },
  { id: 'r2', name: 'Slice of Napoli', cuisine: ['Pizza', 'Italian'], category: 'pizza', rating: 4.3, eta: 35, fee: 40, priceFor2: 650, area: 'Thillai Nagar', open: true, veg: false, approval: 'approved', color: '#dc2626' },
  { id: 'r3', name: 'Dosa Junction', cuisine: ['South Indian', 'Breakfast'], category: 'south', rating: 4.6, eta: 20, fee: 20, priceFor2: 300, area: 'Srirangam', open: true, veg: true, approval: 'approved', color: '#15803d' },
  { id: 'r4', name: 'Burger Barn', cuisine: ['Burgers', 'Fast Food'], category: 'burger', rating: 4.1, eta: 25, fee: 35, priceFor2: 450, area: 'Cantonment', open: true, veg: false, approval: 'approved', color: '#b45309' },
  { id: 'r5', name: 'Wok & Roll', cuisine: ['Chinese', 'Asian'], category: 'chinese', rating: 4.0, eta: 40, fee: 40, priceFor2: 550, area: 'K.K. Nagar', open: false, veg: false, approval: 'approved', color: '#be123c' },
  { id: 'r6', name: 'Sweet Spot', cuisine: ['Desserts', 'Bakery'], category: 'dessert', rating: 4.7, eta: 25, fee: 25, priceFor2: 350, area: 'Thillai Nagar', open: true, veg: true, approval: 'approved', color: '#9d174d' },
  { id: 'r7', name: 'Green Leaf Meals', cuisine: ['South Indian', 'Meals'], category: 'south', imageKey: 'southIndianMeal', rating: 4.4, eta: 30, fee: 20, priceFor2: 280, area: 'Woraiyur', open: true, veg: true, approval: 'approved', color: '#166534' },
  { id: 'r8', name: 'Spice Route Kitchen', cuisine: ['Biryani', 'Mughlai'], category: 'biryani', rating: 0, eta: 0, fee: 30, priceFor2: 600, area: 'Ariyamangalam', open: false, veg: false, approval: 'pending', color: '#92400e' },
];

const menus = {
  r1: [
    ['Chicken Dum Biryani', 'Biryani', 260, false, 'Slow-cooked basmati with tender chicken'],
    ['Mutton Biryani', 'Biryani', 340, false, 'Rich, aromatic and fall-off-the-bone'],
    ['Paneer Tikka', 'Starters', 220, true, 'Charred cottage cheese with mint chutney'],
    ['Butter Naan', 'Breads', 45, true, 'Soft tandoor-baked bread'],
    ['Gulab Jamun (2 pc)', 'Desserts', 80, true, 'Warm syrup-soaked milk dumplings'],
  ],
  r2: [
    ['Margherita', 'Pizza', 299, true, 'San Marzano tomato, mozzarella, basil'],
    ['Pepperoni Feast', 'Pizza', 399, false, 'Double pepperoni and mozzarella'],
    ['Farmhouse', 'Pizza', 379, true, 'Capsicum, mushroom, onion, olives'],
    ['Garlic Bread', 'Sides', 129, true, 'Toasted with herb butter'],
    ['Tiramisu', 'Desserts', 169, true, 'Espresso-soaked layers with mascarpone'],
  ],
  r3: [
    ['Masala Dosa', 'Dosa', 90, true, 'Crisp dosa with spiced potato'],
    ['Ghee Podi Dosa', 'Dosa', 110, true, 'Ghee roast with gunpowder'],
    ['Idli (3 pc)', 'Breakfast', 60, true, 'Steamed rice cakes with sambar'],
    ['Medu Vada (2 pc)', 'Breakfast', 55, true, 'Crispy lentil doughnuts'],
    ['Filter Coffee', 'Drinks', 40, true, 'Decoction coffee with frothy milk'],
  ],
  r4: [
    ['Classic Cheeseburger', 'Burgers', 179, false, 'Beef-style patty, cheddar, house sauce'],
    ['Crispy Veg Burger', 'Burgers', 149, true, 'Potato-corn patty, lettuce, mayo'],
    ['Loaded Fries', 'Sides', 129, true, 'Cheese sauce and jalapeño'],
    ['Chicken Wings (6 pc)', 'Sides', 219, false, 'Smoky BBQ glaze'],
    ['Chocolate Shake', 'Drinks', 129, true, 'Thick, cold and chocolatey'],
  ],
  r5: [
    ['Veg Hakka Noodles', 'Noodles', 160, true, 'Wok-tossed with crunchy vegetables'],
    ['Chicken Fried Rice', 'Rice', 190, false, 'Egg, chicken, spring onion'],
    ['Gobi Manchurian', 'Starters', 150, true, 'Crispy cauliflower in tangy sauce'],
    ['Chilli Chicken', 'Starters', 210, false, 'Spicy dry-style classic'],
  ],
  r6: [
    ['Chocolate Truffle Slice', 'Cakes', 120, true, 'Dense dark chocolate ganache'],
    ['Red Velvet Jar', 'Cakes', 140, true, 'Layered cream cheese frosting'],
    ['Brownie with Ice Cream', 'Desserts', 149, true, 'Warm brownie, vanilla scoop'],
    ['Mango Cheesecake', 'Cakes', 175, true, 'Seasonal alphonso mango'],
  ],
  r7: [
    ['Full Meals', 'Meals', 140, true, 'Rice, sambar, rasam, curd, 3 sides'],
    ['Mini Tiffin', 'Tiffin', 85, true, 'Idli, vada, pongal and chutneys'],
    ['Curd Rice', 'Rice', 70, true, 'Cool, creamy and tempered'],
    ['Payasam', 'Desserts', 50, true, 'Rice and jaggery pudding'],
  ],
  r8: [
    ['Hyderabadi Biryani', 'Biryani', 290, false, 'Awaiting restaurant approval'],
  ],
};

export const foods = Object.entries(menus).flatMap(([restaurantId, items]) =>
  items.map(([name, section, price, veg, description], i) => ({
    id: `${restaurantId}-f${i + 1}`,
    restaurantId,
    name,
    section,
    price,
    veg,
    description,
    isAvailable: !(restaurantId === 'r2' && name === 'Tiramisu'),
  })),
);

export const coupons = [
  { id: 'c1', code: 'WELCOME50', type: 'percent', value: 50, max: 100, minOrder: 199, validUntil: '2026-12-31', usageLimit: 1000, used: 212, active: true },
  { id: 'c2', code: 'FLAT75', type: 'flat', value: 75, max: 75, minOrder: 499, validUntil: '2026-11-30', usageLimit: 500, used: 98, active: true },
  { id: 'c3', code: 'DIWALI20', type: 'percent', value: 20, max: 150, minOrder: 299, validUntil: '2026-11-15', usageLimit: 2000, used: 640, active: true },
  { id: 'c4', code: 'OLDDEAL', type: 'flat', value: 30, max: 30, minOrder: 150, validUntil: '2026-01-01', usageLimit: 100, used: 100, active: false },
];

export const deliveryPartners = [
  { id: 'd1', name: 'Karthik R', phone: '98765 43210', vehicle: 'TN 45 AB 1234', verified: true, status: 'active', online: true, rating: 4.8, trips: 482 },
  { id: 'd2', name: 'Suresh M', phone: '98765 11122', vehicle: 'TN 45 CD 5678', verified: true, status: 'active', online: false, rating: 4.6, trips: 301 },
  { id: 'd3', name: 'Priya S', phone: '98765 99887', vehicle: 'TN 48 EF 9012', verified: true, status: 'active', online: true, rating: 4.9, trips: 215 },
  { id: 'd4', name: 'Arun K', phone: '98765 55443', vehicle: 'TN 45 GH 3456', verified: false, status: 'pending', online: false, rating: 0, trips: 0 },
];

export const demoAccounts = {
  customer: { id: 'u1', name: 'Aarav Kumar', email: 'customer@fooddash.test', phone: '90000 11111', role: 'customer' },
  admin: { id: 'a1', name: 'Meera Nair', email: 'admin@fooddash.test', phone: '90000 22222', role: 'admin' },
  delivery: { id: 'd1', name: 'Karthik R', email: 'rider@fooddash.test', phone: '98765 43210', role: 'delivery' },
};

export const savedAddresses = [
  { id: 'ad1', label: 'Home', line: '12, Gandhi Street, Cantonment', city: 'Tiruchirappalli', postalCode: '620001', isDefault: true },
  { id: 'ad2', label: 'Work', line: 'Plot 8, SIDCO Industrial Estate', city: 'Tiruchirappalli', postalCode: '620015', isDefault: false },
];

const now = Date.now();
const mins = (m) => new Date(now - m * 60000).toISOString();

const hist = (steps) => steps.map(([to, ago, actor]) => ({ to, at: mins(ago), actor }));

export const seedOrders = [
  {
    id: 'o1', orderNumber: 'FD-10231', customerId: 'u1', customerName: 'Aarav Kumar', restaurantId: 'r1',
    items: [{ foodId: 'r1-f1', name: 'Chicken Dum Biryani', price: 260, qty: 2 }],
    address: '12, Gandhi Street, Cantonment', subtotal: 520, deliveryFee: 30, tax: 26, discount: 0, total: 576,
    paymentMethod: 'online', paymentStatus: 'paid', status: 'out_for_delivery', deliveryPartnerId: 'd1',
    createdAt: mins(48), history: hist([['placed', 48, 'customer'], ['confirmed', 46, 'admin'], ['preparing', 44, 'admin'], ['ready_for_pickup', 25, 'admin'], ['delivery_assigned', 23, 'admin'], ['picked_up', 14, 'delivery'], ['out_for_delivery', 12, 'delivery']]),
  },
  {
    id: 'o2', orderNumber: 'FD-10232', customerId: 'u9', customerName: 'Divya P', restaurantId: 'r3',
    items: [{ foodId: 'r3-f1', name: 'Masala Dosa', price: 90, qty: 2 }, { foodId: 'r3-f5', name: 'Filter Coffee', price: 40, qty: 2 }],
    address: '4, Temple Road, Srirangam', subtotal: 260, deliveryFee: 20, tax: 13, discount: 0, total: 293,
    paymentMethod: 'cod', paymentStatus: 'pending', status: 'placed', deliveryPartnerId: null,
    createdAt: mins(3), history: hist([['placed', 3, 'customer']]),
  },
  {
    id: 'o3', orderNumber: 'FD-10233', customerId: 'u10', customerName: 'Rohit S', restaurantId: 'r2',
    items: [{ foodId: 'r2-f2', name: 'Pepperoni Feast', price: 399, qty: 1 }, { foodId: 'r2-f4', name: 'Garlic Bread', price: 129, qty: 1 }],
    address: '21, Anna Nagar, Thillai Nagar', subtotal: 528, deliveryFee: 40, tax: 26, discount: 53, total: 541,
    paymentMethod: 'online', paymentStatus: 'paid', status: 'preparing', deliveryPartnerId: null,
    createdAt: mins(16), history: hist([['placed', 16, 'customer'], ['confirmed', 14, 'admin'], ['preparing', 12, 'admin']]),
  },
  {
    id: 'o4', orderNumber: 'FD-10234', customerId: 'u11', customerName: 'Sana F', restaurantId: 'r6',
    items: [{ foodId: 'r6-f3', name: 'Brownie with Ice Cream', price: 149, qty: 3 }],
    address: '9, Bharathi Salai, Thillai Nagar', subtotal: 447, deliveryFee: 25, tax: 22, discount: 0, total: 494,
    paymentMethod: 'online', paymentStatus: 'paid', status: 'ready_for_pickup', deliveryPartnerId: null,
    createdAt: mins(28), history: hist([['placed', 28, 'customer'], ['confirmed', 26, 'admin'], ['preparing', 24, 'admin'], ['ready_for_pickup', 2, 'admin']]),
  },
  {
    id: 'o5', orderNumber: 'FD-10198', customerId: 'u1', customerName: 'Aarav Kumar', restaurantId: 'r4',
    items: [{ foodId: 'r4-f1', name: 'Classic Cheeseburger', price: 179, qty: 2 }, { foodId: 'r4-f3', name: 'Loaded Fries', price: 129, qty: 1 }],
    address: '12, Gandhi Street, Cantonment', subtotal: 487, deliveryFee: 35, tax: 24, discount: 0, total: 546,
    paymentMethod: 'online', paymentStatus: 'paid', status: 'delivered', deliveryPartnerId: 'd1',
    createdAt: mins(60 * 26), reviewed: true, rating: 5,
    history: hist([['placed', 1560, 'customer'], ['confirmed', 1558, 'admin'], ['preparing', 1555, 'admin'], ['ready_for_pickup', 1540, 'admin'], ['delivery_assigned', 1538, 'admin'], ['picked_up', 1530, 'delivery'], ['out_for_delivery', 1528, 'delivery'], ['delivered', 1515, 'delivery']]),
  },
  {
    id: 'o6', orderNumber: 'FD-10177', customerId: 'u1', customerName: 'Aarav Kumar', restaurantId: 'r3',
    items: [{ foodId: 'r3-f3', name: 'Idli (3 pc)', price: 60, qty: 2 }],
    address: '12, Gandhi Street, Cantonment', subtotal: 120, deliveryFee: 20, tax: 6, discount: 0, total: 146,
    paymentMethod: 'cod', paymentStatus: 'paid', status: 'delivered', deliveryPartnerId: 'd3',
    createdAt: mins(60 * 72), reviewed: false,
    history: hist([['placed', 4320, 'customer'], ['confirmed', 4318, 'admin'], ['preparing', 4315, 'admin'], ['ready_for_pickup', 4300, 'admin'], ['delivery_assigned', 4298, 'admin'], ['picked_up', 4290, 'delivery'], ['out_for_delivery', 4288, 'delivery'], ['delivered', 4275, 'delivery']]),
  },
];

export const supportTickets = [
  { id: 't1', subject: 'Missing item in order FD-10198', from: 'Aarav Kumar', status: 'open', createdAt: mins(120) },
  { id: 't2', subject: 'Refund not received', from: 'Divya P', status: 'open', createdAt: mins(300) },
  { id: 't3', subject: 'Wrong address pin', from: 'Rohit S', status: 'resolved', createdAt: mins(2000) },
];
