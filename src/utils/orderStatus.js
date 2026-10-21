// Single source of truth for order lifecycle. Mirrors blueprint section 8.
// In production this logic lives on the server; the frontend only requests transitions.
import {
  CheckCircle2, ChefHat, Clock, PackageCheck, Bike, Truck, Home, XCircle, Ban, RotateCcw, CreditCard,
} from 'lucide-react';

export const STATUS_META = {
  pending_payment: { label: 'Awaiting payment', tone: 'warning', icon: CreditCard },
  placed: { label: 'Order placed', tone: 'info', icon: Clock },
  confirmed: { label: 'Confirmed', tone: 'info', icon: CheckCircle2 },
  preparing: { label: 'Preparing', tone: 'warning', icon: ChefHat },
  ready_for_pickup: { label: 'Ready for pickup', tone: 'warning', icon: PackageCheck },
  delivery_assigned: { label: 'Partner assigned', tone: 'info', icon: Bike },
  picked_up: { label: 'Picked up', tone: 'info', icon: PackageCheck },
  out_for_delivery: { label: 'Out for delivery', tone: 'info', icon: Truck },
  delivered: { label: 'Delivered', tone: 'success', icon: Home },
  rejected: { label: 'Rejected', tone: 'danger', icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: Ban },
  refund_pending: { label: 'Refund pending', tone: 'warning', icon: RotateCcw },
  refunded: { label: 'Refunded', tone: 'neutral', icon: RotateCcw },
};

// Who may move an order from one state to another.
export const TRANSITIONS = {
  placed: { confirmed: ['admin'], rejected: ['admin'], cancelled: ['customer', 'admin'] },
  confirmed: { preparing: ['admin'], cancelled: ['admin'] },
  preparing: { ready_for_pickup: ['admin'] },
  ready_for_pickup: { delivery_assigned: ['admin', 'delivery'] },
  delivery_assigned: { picked_up: ['delivery'] },
  picked_up: { out_for_delivery: ['delivery'] },
  out_for_delivery: { delivered: ['delivery'] },
  rejected: { refund_pending: ['admin'] },
  cancelled: { refund_pending: ['admin'] },
  refund_pending: { refunded: ['admin'] },
};

export function canTransition(from, to, actor) {
  return Boolean(TRANSITIONS[from]?.[to]?.includes(actor));
}

export const TIMELINE = [
  'placed', 'confirmed', 'preparing', 'ready_for_pickup', 'delivery_assigned', 'picked_up', 'out_for_delivery', 'delivered',
];

export const TERMINAL = ['delivered', 'rejected', 'cancelled', 'refunded'];

// Demo proof-of-delivery code: last 4 digits of the order number. Real app: random one-time code stored server-side.
export const deliveryCode = (order) => order.orderNumber.replace(/\D/g, '').slice(-4);

export const money =(n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

// Server-side style pricing. Totals are always recomputed here, never trusted from UI state.
export function priceQuote(lines, restaurant, coupon) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryFee = lines.length && restaurant ? restaurant.fee : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  let discount = 0;
  if (coupon && coupon.active && subtotal >= coupon.minOrder) {
    discount = coupon.type === 'percent' ? Math.min(Math.round(subtotal * coupon.value) / 100, coupon.max) : coupon.value;
  }
  const total = Math.max(0, subtotal + deliveryFee + tax - discount);
  return { subtotal, deliveryFee, tax, discount, total };
}
