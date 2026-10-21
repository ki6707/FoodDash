import { Link, useParams } from 'react-router-dom';
import { Clock, Minus, Plus, ShoppingBag, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cover, Empty, Rating } from '../components/shared';
import { getDishImage, getRestaurantImage } from '../data/foodImages';
import { money, priceQuote } from '../utils/orderStatus';

function VegMark({ veg }) {
  return (
    <span aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'} title={veg ? 'Vegetarian' : 'Non-vegetarian'}
      style={{ display: 'inline-grid', placeItems: 'center', width: 16, height: 16, border: `2px solid ${veg ? '#15803d' : '#991b1b'}`, borderRadius: 3 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: veg ? '#15803d' : '#991b1b' }} />
    </span>
  );
}

export function CartSummary({ compact = false }) {
  const { cartLines, cartRestaurant, setQty } = useApp();
  const q = priceQuote(cartLines, cartRestaurant, null);
  if (!cartLines.length) return <p className="muted">Your cart is empty. Add something tasty.</p>;
  return (
    <div>
      {cartRestaurant && <p className="muted" style={{ marginBottom: 8 }}>From <strong>{cartRestaurant.name}</strong></p>}
      {cartLines.map((l) => (
        <div key={l.foodId} className="row between" style={{ padding: '6px 0' }}>
          <span className="grow">{l.name}</span>
          {!compact && (
            <span className="qty">
              <button onClick={() => setQty(l.foodId, l.qty - 1)} aria-label={`Remove one ${l.name}`}><Minus size={16} /></button>
              <span>{l.qty}</span>
              <button onClick={() => setQty(l.foodId, l.qty + 1)} aria-label={`Add one ${l.name}`}><Plus size={16} /></button>
            </span>
          )}
          <span>{money(l.price * l.qty)}</span>
        </div>
      ))}
      <div className="sum-row"><span className="muted">Subtotal</span><span>{money(q.subtotal)}</span></div>
      <div className="sum-row"><span className="muted">Delivery</span><span>{money(q.deliveryFee)}</span></div>
      <div className="sum-row"><span className="muted">Taxes (5%)</span><span>{money(q.tax)}</span></div>
      <div className="sum-row total"><span>Total</span><span>{money(q.total)}</span></div>
    </div>
  );
}

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const { restaurants, foods, cart, addToCart, setQty, cartCount, toast } = useApp();
  const r = restaurants.find((x) => x.id === restaurantId);
  if (!r) return <Empty icon={Store} title="Restaurant not found"><Link className="btn" to="/restaurants">Back to restaurants</Link></Empty>;

  const items = foods.filter((f) => f.restaurantId === r.id);
  const sections = [...new Set(items.map((f) => f.section))];
  const canOrder = r.open && r.approval === 'approved';

  const add = (f) => {
    const switching = cart.restaurantId && cart.restaurantId !== f.restaurantId && cartCount > 0;
    addToCart(f);
    toast(switching ? `Started a new cart with ${r.name}` : `${f.name} added to cart`);
  };

  return (
    <div className="stack">
      <div className="card block flush">
        <Cover color={r.color} category={r.category} imageUrl={getRestaurantImage(r).src} size={64} label={getRestaurantImage(r).alt} className="restaurant-menu-cover" />
        <div style={{ padding: 24 }}>
          <div className="row between"><h1 style={{ margin: 0 }}>{r.name}</h1><Rating value={r.rating} /></div>
          <p className="muted">{r.cuisine.join(' · ')} · {r.area}</p>
          <div className="meta">
            <span><Clock size={14} aria-hidden="true" /> {r.eta ? `${r.eta} min` : 'Not yet open'}</span>
            <span>Delivery {money(r.fee)}</span>
            <span className={`badge ${canOrder ? 'success' : 'neutral'}`}>{canOrder ? 'Open now' : 'Closed'}</span>
          </div>
        </div>
      </div>

      <div className="menu-layout">
        <div className="stack">
          {sections.map((s) => (
            <section key={s} aria-labelledby={`sec-${s}`}>
              <h2 id={`sec-${s}`}>{s}</h2>
              <div className="card flush">
                {items.filter((f) => f.section === s).map((f) => {
                  const qty = cart.items[f.id] ?? 0;
                  const disabled = !f.isAvailable || !canOrder;
                  return (
                    <div key={f.id} className="food-item">
                      <Cover color={r.color} category={r.category} imageUrl={getDishImage(f.name, r.category).src} size={28} label={getDishImage(f.name, r.category).alt} />
                      <div>
                        <div className="row" style={{ gap: 8 }}><VegMark veg={f.veg} /><strong>{f.name}</strong></div>
                        <div>{money(f.price)}</div>
                        <div className="muted" style={{ fontSize: '0.9rem' }}>{f.description}</div>
                        {!f.isAvailable && <span className="badge neutral" style={{ marginTop: 4 }}>Currently unavailable</span>}
                      </div>
                      <div className="actions">
                        {qty > 0 ? (
                          <span className="qty">
                            <button onClick={() => setQty(f.id, qty - 1)} aria-label={`Remove one ${f.name}`}><Minus size={16} /></button>
                            <span aria-live="polite">{qty}</span>
                            <button onClick={() => setQty(f.id, qty + 1)} aria-label={`Add one ${f.name}`}><Plus size={16} /></button>
                          </span>
                        ) : (
                          <button className="btn sm primary" disabled={disabled} onClick={() => add(f)}>Add</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <aside className="card block sticky-cart" aria-label="Your cart">
          <h3><ShoppingBag size={18} aria-hidden="true" style={{ verticalAlign: -3 }} /> Your cart</h3>
          <CartSummary />
          {cartCount > 0 && <Link to="/cart" className="btn primary lg" style={{ marginTop: 16 }}>Review cart</Link>}
        </aside>
      </div>
    </div>
  );
}
