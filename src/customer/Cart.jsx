import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Empty } from '../components/shared';
import { CartSummary } from './RestaurantMenu';

export default function Cart() {
  const { cartLines, cartRestaurant, clearCart, user } = useApp();
  const nav = useNavigate();
  const unavailable = cartLines.filter((l) => !l.isAvailable);

  if (!cartLines.length) {
    return (
      <Empty icon={ShoppingBag} title="Your cart is empty">
        <p>Pick a restaurant and add a few dishes.</p>
        <Link className="btn primary" to="/restaurants">Browse restaurants</Link>
      </Empty>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>Your cart</h1>
      {unavailable.length > 0 && (
        <div className="card" role="alert" style={{ borderColor: 'var(--color-destructive)' }}>
          <div className="row"><AlertTriangle size={20} aria-hidden="true" /><strong>Some items are no longer available</strong></div>
          <p className="muted" style={{ margin: '8px 0 0' }}>Remove {unavailable.map((u) => u.name).join(', ')} to continue.</p>
        </div>
      )}
      <div className="card block"><CartSummary /></div>
      <p className="muted">Coupons are applied at checkout. Final totals are confirmed by the server when you place the order.</p>
      <div className="row">
        <button className="btn danger" onClick={clearCart}><Trash2 size={16} aria-hidden="true" /> Clear cart</button>
        {cartRestaurant && <Link className="btn" to={`/restaurants/${cartRestaurant.id}`}>Add more items</Link>}
        <button className="btn primary grow" disabled={unavailable.length > 0} onClick={() => nav(user ? '/checkout' : '/login?role=customer', { state: { from: '/checkout' } })}>
          {user ? 'Proceed to checkout' : 'Log in to checkout'}
        </button>
      </div>
    </div>
  );
}
