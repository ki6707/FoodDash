import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { coupons as seedCoupons, deliveryPartners as seedPartners, demoAccounts, foods as seedFoods, restaurants as seedRestaurants, seedOrders } from '../data/mock';
import { canTransition, priceQuote } from '../utils/orderStatus';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const STORE_KEY = 'fooddash-prototype-v1';

function restoreRestaurants(savedRestaurants) {
  if (!Array.isArray(savedRestaurants)) return seedRestaurants;
  const seedById = new Map(seedRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  return savedRestaurants.map((restaurant) => {
    const seed = seedById.get(restaurant.id);
    return seed?.imageKey && !restaurant.imageKey ? { ...restaurant, imageKey: seed.imageKey } : restaurant;
  });
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const saved = useMemo(load, []);
  const [user, setUser] = useState(saved?.user ?? null);
  const [orders, setOrders] = useState(saved?.orders ?? seedOrders);
  const [cart, setCart] = useState(saved?.cart ?? { restaurantId: null, items: {} });
  const [restaurants, setRestaurants] = useState(() => restoreRestaurants(saved?.restaurants));
  const [foods, setFoods] = useState(saved?.foods ?? seedFoods);
  const [coupons, setCoupons] = useState(saved?.coupons ?? seedCoupons);
  const [partners, setPartners] = useState(saved?.partners ?? seedPartners);
  const [declined, setDeclined] = useState(saved?.declined ?? []);
  const [audit, setAudit] = useState(saved?.audit ?? []);
  const [toasts, setToasts] = useState([]);

  // Persist so a refresh keeps the demo state (browser storage is only a convenience in this prototype).
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ user, orders, cart, restaurants, foods, coupons, partners, declined, audit }));
    } catch { /* storage unavailable: app still works in memory */ }
  }, [user, orders, cart, restaurants, foods, coupons, partners, declined, audit]);

  const toast = useCallback((message) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const logAudit = useCallback((action, detail) => {
    setAudit((a) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), actor: user?.name ?? 'system', action, detail }, ...a].slice(0, 100));
  }, [user]);

  // Auth (mock). Real app: POST /api/auth/login and server-issued session.
  const login = (role) => {
    setUser(demoAccounts[role]);
  };
  const logout = () => setUser(null);

  // Cart
  const addToCart = (food) => {
    setCart((c) => {
      if (c.restaurantId && c.restaurantId !== food.restaurantId && Object.keys(c.items).length) {
        return { restaurantId: food.restaurantId, items: { [food.id]: 1 } };
      }
      return { restaurantId: food.restaurantId, items: { ...c.items, [food.id]: (c.items[food.id] ?? 0) + 1 } };
    });
  };
  const setQty = (foodId, qty) => {
    setCart((c) => {
      const items = { ...c.items };
      if (qty <= 0) delete items[foodId]; else items[foodId] = qty;
      return { restaurantId: Object.keys(items).length ? c.restaurantId : null, items };
    });
  };
  const clearCart = () => setCart({ restaurantId: null, items: {} });

  const cartLines = useMemo(
    () => Object.entries(cart.items).map(([foodId, qty]) => {
      const f = foods.find((x) => x.id === foodId);
      return f ? { foodId, name: f.name, price: f.price, qty, isAvailable: f.isAvailable, veg: f.veg } : null;
    }).filter(Boolean),
    [cart, foods],
  );
  const cartRestaurant = restaurants.find((r) => r.id === cart.restaurantId) ?? null;
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);

  // Orders
  const placeOrder = ({ address, paymentMethod, coupon, instructions }) => {
    const q = priceQuote(cartLines, cartRestaurant, coupon);
    const num = `FD-${10000 + orders.length + 235}`;
    const order = {
      id: crypto.randomUUID(), orderNumber: num, customerId: user.id, customerName: user.name,
      restaurantId: cart.restaurantId,
      items: cartLines.map(({ foodId, name, price, qty }) => ({ foodId, name, price, qty })),
      address, instructions, ...q,
      paymentMethod, paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'placed', deliveryPartnerId: null, createdAt: new Date().toISOString(),
      history: [{ to: 'placed', at: new Date().toISOString(), actor: 'customer' }],
    };
    setOrders((o) => [order, ...o]);
    clearCart();
    return order;
  };

  // Every status change goes through here and is validated like a backend would.
  const transitionOrder = (orderId, to, actor, extra = {}) => {
    // Check against current state first so the caller gets a reliable result (e.g. a rider losing a race).
    const current = orders.find((o) => o.id === orderId);
    const ok = Boolean(current && canTransition(current.status, to, actor));
    if (!ok) return false;
    setOrders((list) => list.map((o) => {
      if (o.id !== orderId || !canTransition(o.status, to, actor)) return o;
      const updated = { ...o, ...extra, status: to, history: [...o.history, { to, at: new Date().toISOString(), actor }] };
      if (to === 'delivered' && o.paymentMethod === 'cod') updated.paymentStatus = 'paid';
      if (to === 'cancelled' || to === 'rejected') updated.paymentStatus = o.paymentStatus === 'paid' ? 'refund_due' : 'void';
      if (to === 'refunded') updated.paymentStatus = 'refunded';
      return updated;
    }));
    return true;
  };

  const reportException = (orderId, reason) => {
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, exception: reason } : o)));
  };

  const assignPartner = (orderId, partnerId) => {
    const ok = transitionOrder(orderId, 'delivery_assigned', 'admin', { deliveryPartnerId: partnerId });
    if (ok) logAudit('Assigned delivery partner', `Order ${orders.find((o) => o.id === orderId)?.orderNumber} → ${partners.find((p) => p.id === partnerId)?.name}`);
    return ok;
  };

  const reviewOrder = (orderId, rating, comment) => {
    setOrders((list) => list.map((o) => (o.id === orderId && o.status === 'delivered' ? { ...o, reviewed: true, rating, comment } : o)));
  };

  const value = {
    user, login, logout,
    restaurants, setRestaurants, foods, setFoods, coupons, setCoupons, partners, setPartners,
    cart, cartLines, cartRestaurant, cartCount, addToCart, setQty, clearCart,
    orders, placeOrder, transitionOrder, assignPartner, reviewOrder, reportException,
    declined, declineOffer: (id) => setDeclined((d) => [...d, id]),
    audit, logAudit, toast,
    resetDemo: () => { localStorage.removeItem(STORE_KEY); window.location.reload(); },
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </AppContext.Provider>
  );
}
