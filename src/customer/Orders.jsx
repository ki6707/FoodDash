import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bike, ChevronRight, Receipt, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Empty, Modal, OrderTimeline, PaymentBadge, StatusBadge } from '../components/shared';
import { canTransition, deliveryCode, money, timeAgo } from '../utils/orderStatus';

export function Orders() {
  const { orders, restaurants, user } = useApp();
  const mine = orders.filter((o) => o.customerId === user.id);
  if (!mine.length) {
    return <Empty icon={Receipt} title="No orders yet"><Link to="/restaurants" className="btn primary">Order something</Link></Empty>;
  }
  return (
    <div className="stack">
      <h1>Your orders</h1>
      {mine.map((o) => {
        const r = restaurants.find((x) => x.id === o.restaurantId);
        return (
          <Link key={o.id} to={`/orders/${o.id}`} className="card row between" style={{ flexWrap: 'nowrap' }}>
            <div>
              <strong>{r?.name}</strong> <span className="muted">· {o.orderNumber}</span>
              <div className="muted" style={{ fontSize: '0.9rem' }}>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</div>
              <div className="row" style={{ marginTop: 6 }}><StatusBadge status={o.status} /><span className="muted">{timeAgo(o.createdAt)}</span></div>
            </div>
            <div className="row" style={{ flexWrap: 'nowrap' }}><strong>{money(o.total)}</strong><ChevronRight aria-hidden="true" /></div>
          </Link>
        );
      })}
    </div>
  );
}

export function OrderDetail() {
  const { orderId } = useParams();
  const { orders, restaurants, partners, transitionOrder, reviewOrder, toast, user } = useApp();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const o = orders.find((x) => x.id === orderId && x.customerId === user.id); // customers only see their own orders
  if (!o) return <Empty icon={Receipt} title="Order not found"><Link to="/orders" className="btn">Back to orders</Link></Empty>;

  const r = restaurants.find((x) => x.id === o.restaurantId);
  const partner = partners.find((p) => p.id === o.deliveryPartnerId);
  const cancellable = canTransition(o.status, 'cancelled', 'customer');
  const refundNote = o.paymentStatus === 'paid' ? 'Because you paid online, a refund will be raised after cancellation.' : 'You have not been charged.';

  return (
    <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/orders" className="muted">← All orders</Link>
      <div className="row between">
        <div><h1 style={{ marginBottom: 4 }}>{o.orderNumber}</h1><span className="muted">{r?.name} · {timeAgo(o.createdAt)}</span></div>
        <div className="row"><StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} /></div>
      </div>

      <div className="grid cols-2">
        <section className="card block" aria-labelledby="prog"><h3 id="prog">Progress</h3><OrderTimeline order={o} /></section>
        <div className="stack">
          {partner && o.status !== 'delivered' && (
            <section className="card row" aria-label="Delivery partner">
              <Bike aria-hidden="true" />
              <div><strong>{partner.name}</strong><div className="muted">is handling your delivery</div></div>
            </section>
          )}
          {o.status === 'out_for_delivery' && (
            <section className="card" aria-label="Delivery code">
              <div className="muted">Share this code with your rider on arrival</div>
              <div className="otp" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.4em' }}>{deliveryCode(o)}</div>
            </section>
          )}
          <section className="card" aria-labelledby="det">
            <h3 id="det">Details</h3>
            {o.items.map((i) => <div key={i.foodId} className="sum-row"><span>{i.qty} × {i.name}</span><span>{money(i.price * i.qty)}</span></div>)}
            <div className="sum-row"><span className="muted">Delivery</span><span>{money(o.deliveryFee)}</span></div>
            <div className="sum-row"><span className="muted">Taxes</span><span>{money(o.tax)}</span></div>
            {o.discount > 0 && <div className="sum-row"><span className="muted">Discount</span><span>−{money(o.discount)}</span></div>}
            <div className="sum-row total"><span>Total</span><span>{money(o.total)}</span></div>
            <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>Delivering to {o.address}</p>
          </section>
        </div>
      </div>

      {cancellable && (
        <div className="card row between">
          <span className="muted">You can cancel until the restaurant starts preparing.</span>
          <button className="btn danger" onClick={() => setConfirmCancel(true)}>Cancel order</button>
        </div>
      )}
      {!cancellable && !['delivered', 'cancelled', 'rejected', 'refund_pending', 'refunded'].includes(o.status) && (
        <p className="muted">This order can no longer be cancelled because the restaurant has started preparing it. <Link to="/profile" style={{ textDecoration: 'underline' }}>Contact support</Link> if something is wrong.</p>
      )}

      {o.status === 'delivered' && !o.reviewed && (
        <section className="card stack" aria-labelledby="rv">
          <h3 id="rv">How was your order?</h3>
          <div className="row" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className="icon-btn" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
                <Star size={20} fill={n <= rating ? 'currentColor' : 'none'} color={n <= rating ? '#a16207' : 'currentColor'} />
              </button>
            ))}
          </div>
          <div className="field"><label htmlFor="cm">Comment (optional)</label><textarea id="cm" className="input" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
          <button className="btn primary" disabled={!rating} onClick={() => { reviewOrder(o.id, rating, comment); toast('Thanks for your feedback'); }}>Submit review</button>
        </section>
      )}
      {o.reviewed && <p className="badge success" style={{ width: 'fit-content' }}>You rated this order {o.rating ?? '—'}/5</p>}

      {confirmCancel && (
        <Modal title="Cancel this order?" onClose={() => setConfirmCancel(false)}>
          <p>{refundNote}</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setConfirmCancel(false)}>Keep order</button>
            <button className="btn danger" onClick={() => { transitionOrder(o.id, 'cancelled', 'customer'); setConfirmCancel(false); toast('Order cancelled'); }}>Yes, cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
