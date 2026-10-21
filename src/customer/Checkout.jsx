import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle2, CreditCard, Loader2, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { savedAddresses } from '../data/mock';
import { money, priceQuote } from '../utils/orderStatus';

export default function Checkout() {
  const { cartLines, cartRestaurant, coupons, placeOrder, toast } = useApp();
  const nav = useNavigate();
  const [addressId, setAddressId] = useState(savedAddresses.find((a) => a.isDefault)?.id);
  const [instructions, setInstructions] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState(null);
  const [method, setMethod] = useState('online');
  const [simulateFail, setSimulateFail] = useState(false);
  const [state, setState] = useState('idle'); // idle | processing | failed
  const [error, setError] = useState('');
  const orderPlaced = useRef(false);

  // Once the order is placed the cart is emptied; don't let the empty-cart guard redirect away from the confirmation.
  if (orderPlaced.current) return null;
  if (!cartLines.length) return <Navigate to="/cart" replace />;

  const quote = priceQuote(cartLines, cartRestaurant, coupon);
  const address = savedAddresses.find((a) => a.id === addressId);

  const applyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    const c = coupons.find((x) => x.code === code);
    const sub = priceQuote(cartLines, cartRestaurant, null).subtotal;
    if (!c || !c.active) return setCouponMsg({ ok: false, text: 'That coupon is invalid or has expired.' });
    if (sub < c.minOrder) return setCouponMsg({ ok: false, text: `Add ${money(c.minOrder - sub)} more to use ${c.code}.` });
    if (c.used >= c.usageLimit) return setCouponMsg({ ok: false, text: 'This coupon has reached its usage limit.' });
    setCoupon(c);
    setCouponMsg({ ok: true, text: `${c.code} applied.` });
  };

  const submit = async () => {
    if (state === 'processing') return; // guards double submit (idempotency in the real API too)
    if (!address) return setError('Select a delivery address.');
    setError('');
    if (method === 'online') {
      setState('processing');
      await new Promise((r) => setTimeout(r, 1200)); // stands in for gateway + server-side verification
      if (simulateFail) {
        setState('failed');
        return;
      }
    }
    orderPlaced.current = true;
    const order = placeOrder({ address: `${address.line}, ${address.city} ${address.postalCode}`, paymentMethod: method, coupon, instructions });
    toast(`Order ${order.orderNumber} placed`);
    nav(`/orders/${order.id}`, { replace: true });
  };

  return (
    <div className="stack" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1>Checkout</h1>
      <ol className="steps" aria-label="Checkout progress">
        <li className="step done"><span className="dot"><CheckCircle2 size={16} /></span> Cart</li>
        <li className="step current"><span className="dot">2</span> Address & payment</li>
        <li className="step"><span className="dot">3</span> Confirmation</li>
      </ol>
      <div className="menu-layout">
        <div className="stack">
          <section className="card stack" aria-labelledby="addr">
            <h3 id="addr">Delivery address</h3>
            <div role="radiogroup" aria-labelledby="addr" className="stack">
              {savedAddresses.map((a) => (
                <label key={a.id} className="pay-option">
                  <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <span><strong>{a.label}</strong><br /><span className="muted">{a.line}, {a.city} {a.postalCode}</span></span>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="ins">Delivery instructions (optional)</label>
              <textarea id="ins" className="input" value={instructions} maxLength={200} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Ring the bell twice" />
            </div>
          </section>

          <section className="card stack" aria-labelledby="pay">
            <h3 id="pay">Payment</h3>
            <label className="pay-option">
              <input type="radio" name="pay" checked={method === 'online'} onChange={() => setMethod('online')} />
              <CreditCard aria-hidden="true" /> <span><strong>Pay online</strong><br /><span className="muted">Cards, UPI, wallets (test mode)</span></span>
            </label>
            <label className="pay-option">
              <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} />
              <Banknote aria-hidden="true" /> <span><strong>Cash on delivery</strong><br /><span className="muted">Pay the rider when your order arrives</span></span>
            </label>
            {method === 'online' && (
              <label className="row muted" style={{ fontSize: '0.9rem' }}>
                <input type="checkbox" checked={simulateFail} onChange={(e) => { setSimulateFail(e.target.checked); setState('idle'); }} /> Test mode: simulate a failed payment
              </label>
            )}
            {state === 'failed' && (
              <div role="alert" className="badge danger" style={{ padding: 12, borderRadius: 12 }}>
                Payment failed. You have not been charged. Retry, or switch to cash on delivery.
              </div>
            )}
          </section>
        </div>

        <aside className="card block sticky-cart stack" aria-label="Order summary">
          <h3>Order summary</h3>
          <p className="muted" style={{ margin: 0 }}>{cartRestaurant?.name}</p>
          {cartLines.map((l) => <div key={l.foodId} className="sum-row"><span>{l.qty} × {l.name}</span><span>{money(l.price * l.qty)}</span></div>)}
          <form onSubmit={applyCoupon} className="stack">
            <div className="field">
              <label htmlFor="coupon">Coupon code</label>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input id="coupon" className="input grow" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="WELCOME50" style={{ minWidth: 0 }} />
                <button className="btn sm" type="submit"><Tag size={14} aria-hidden="true" /> Apply</button>
              </div>
              {couponMsg && <span className={couponMsg.ok ? 'badge success' : 'error-text'} role="status">{couponMsg.text}</span>}
            </div>
          </form>
          <div>
            <div className="sum-row"><span className="muted">Subtotal</span><span>{money(quote.subtotal)}</span></div>
            <div className="sum-row"><span className="muted">Delivery</span><span>{money(quote.deliveryFee)}</span></div>
            <div className="sum-row"><span className="muted">Taxes</span><span>{money(quote.tax)}</span></div>
            {quote.discount > 0 && <div className="sum-row"><span className="muted">Discount</span><span>−{money(quote.discount)}</span></div>}
            <div className="sum-row total"><span>To pay</span><span>{money(quote.total)}</span></div>
          </div>
          {error && <span className="error-text" role="alert">{error}</span>}
          <button className="btn primary lg" onClick={submit} disabled={state === 'processing'}>
            {state === 'processing' ? <><Loader2 size={18} aria-hidden="true" /> Verifying payment…</> : state === 'failed' ? 'Retry payment' : method === 'cod' ? 'Place order' : `Pay ${money(quote.total)}`}
          </button>
          <Link to="/cart" className="btn ghost">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
}
