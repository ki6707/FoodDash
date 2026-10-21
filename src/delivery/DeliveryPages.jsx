import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bike, Check, MapPin, Navigation, PackageCheck, Power, Store, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Empty, Modal, StatusBadge } from '../components/shared';
import { deliveryCode, money, timeAgo } from '../utils/orderStatus';

const earningFor = (o) => Math.round(o.deliveryFee * 0.8) + 10;
const ACTIVE = ['delivery_assigned', 'picked_up', 'out_for_delivery'];
const mapsUrl = (text) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;

function useMe() {
  const { user, partners, orders } = useApp();
  const me = partners.find((p) => p.id === user.id);
  const mine = orders.filter((o) => o.deliveryPartnerId === user.id);
  return { me, active: mine.find((o) => ACTIVE.includes(o.status)), done: mine.filter((o) => o.status === 'delivered') };
}

export function DeliveryDashboard() {
  const { setPartners, user, toast } = useApp();
  const { me, active, done } = useMe();
  const canWork = me?.verified && me?.status === 'active';
  const toggle = () => {
    if (active && me.online) return toast('Finish your active delivery before going offline.');
    setPartners((ps) => ps.map((p) => (p.id === user.id ? { ...p, online: !p.online } : p)));
  };
  const total = done.reduce((s, o) => s + earningFor(o), 0);

  if (!canWork) {
    return <div className="card" role="alert"><h2>Account not active</h2><p className="muted">Your account is waiting for verification. Contact support to continue.</p></div>;
  }
  return (
    <>
      <section className="card block row between" aria-label="Availability">
        <div>
          <h2 style={{ margin: 0 }}>{me.online ? "You're online" : "You're offline"}</h2>
          <p className="muted" style={{ margin: 0 }}>{me.online ? 'You can receive delivery offers.' : 'Go online to receive offers. Location is not shared while offline.'}</p>
        </div>
        <button className="switch" role="switch" aria-checked={me.online} aria-label="Available for deliveries" onClick={toggle} />
      </section>
      <div className="grid cols-2">
        <div className="card kpi"><span className="icon"><PackageCheck size={20} /></span><span className="value">{done.length}</span><span className="label">Deliveries completed</span></div>
        <div className="card kpi"><span className="icon"><Wallet size={20} /></span><span className="value">{money(total)}</span><span className="label">Total earnings</span></div>
      </div>
      {active ? (
        <Link to="/delivery/active" className="card block row between" style={{ flexWrap: 'nowrap' }}>
          <div><strong>Active delivery · {active.orderNumber}</strong><div className="muted">Tap to continue</div></div><StatusBadge status={active.status} />
        </Link>
      ) : (
        <p className="muted">{me.online ? <>Looking for offers… check <Link to="/delivery/requests" style={{ textDecoration: 'underline' }}>Offers</Link>.</> : 'No active delivery.'}</p>
      )}
    </>
  );
}

export function DeliveryRequests() {
  const { orders, restaurants, user, transitionOrder, declined, declineOffer, toast } = useApp();
  const { me, active } = useMe();
  const offers = orders.filter((o) => o.status === 'ready_for_pickup' && !o.deliveryPartnerId && !declined.includes(`${user.id}:${o.id}`));

  if (!me?.online) return <Empty icon={Power} title="You're offline"><p>Go online from Home to see offers.</p><Link className="btn primary" to="/delivery/dashboard">Go to Home</Link></Empty>;
  if (active) return <Empty icon={Bike} title="Finish your current delivery first"><Link className="btn primary" to="/delivery/active">Open active job</Link></Empty>;
  if (!offers.length) return <Empty icon={Bike} title="No offers right now"><p>New jobs appear here when orders are ready for pickup.</p></Empty>;

  return (
    <>
      <h2>Delivery offers</h2>
      {offers.map((o) => {
        const r = restaurants.find((x) => x.id === o.restaurantId);
        return (
          <section key={o.id} className="card block stack" aria-label={`Offer ${o.orderNumber}`}>
            <div className="row between"><strong>{o.orderNumber}</strong><span className="badge success">Earn {money(earningFor(o))}</span></div>
            <div className="row"><Store size={18} aria-hidden="true" /> Pickup: <strong>{r?.name}</strong>, {r?.area}</div>
            <div className="muted">{o.items.reduce((s, i) => s + i.qty, 0)} items · ready {timeAgo(o.history.at(-1).at)}</div>
            <div className="row">
              <button className="btn lg primary grow" onClick={() => {
                // Server would claim atomically; the store re-checks status so a second rider is refused.
                const ok = transitionOrder(o.id, 'delivery_assigned', 'delivery', { deliveryPartnerId: user.id });
                toast(ok ? 'Job accepted' : 'Sorry, another rider just took this job.');
              }}>Accept</button>
              <button className="btn lg grow" onClick={() => declineOffer(`${user.id}:${o.id}`)}>Decline</button>
            </div>
          </section>
        );
      })}
    </>
  );
}

export function DeliveryActive() {
  const { restaurants, transitionOrder, reportException, toast } = useApp();
  const { active: o } = useMe();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [reporting, setReporting] = useState(false);

  if (!o) return <Empty icon={Navigation} title="No active delivery"><Link className="btn primary" to="/delivery/requests">Find offers</Link></Empty>;
  const r = restaurants.find((x) => x.id === o.restaurantId);
  const pickupText = `${r?.name}, ${r?.area}, Tiruchirappalli`;

  const next = () => {
    if (o.status === 'delivery_assigned') { transitionOrder(o.id, 'picked_up', 'delivery'); toast('Pickup confirmed'); }
    else if (o.status === 'picked_up') { transitionOrder(o.id, 'out_for_delivery', 'delivery'); toast('On the way to the customer'); }
  };
  const complete = (e) => {
    e.preventDefault();
    if (code !== deliveryCode(o)) return setErr('That code does not match. Ask the customer for their 4-digit code.');
    setErr('');
    transitionOrder(o.id, 'delivered', 'delivery');
    toast(`Delivered. You earned ${money(earningFor(o))}`);
  };

  return (
    <>
      <div className="row between"><h2 style={{ margin: 0 }}>{o.orderNumber}</h2><StatusBadge status={o.status} /></div>
      {o.exception && <div className="badge warning" style={{ padding: 10, borderRadius: 12 }}><AlertTriangle size={14} aria-hidden="true" /> Reported: {o.exception}. Support has been notified.</div>}

      <section className="card block stack" aria-label="Pickup">
        <div className="row"><Store size={18} aria-hidden="true" /><strong>Pickup</strong></div>
        <div>{r?.name}<div className="muted">{r?.area}</div></div>
        <a className="btn" href={mapsUrl(pickupText)} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" /> Navigate to restaurant</a>
      </section>

      {o.status !== 'delivery_assigned' && (
        <section className="card block stack" aria-label="Drop-off">
          <div className="row"><MapPin size={18} aria-hidden="true" /><strong>Drop-off</strong></div>
          <div>{o.customerName}<div className="muted">{o.address}</div>{o.instructions && <div className="muted">Note: {o.instructions}</div>}</div>
          <a className="btn" href={mapsUrl(o.address)} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" /> Navigate to customer</a>
        </section>
      )}

      <section className="card stack" aria-label="Order contents">
        <strong>Check the order</strong>
        {o.items.map((i) => <div key={i.foodId} className="sum-row"><span>{i.qty} × {i.name}</span></div>)}
        {o.paymentMethod === 'cod' && <div className="badge warning">Collect {money(o.total)} cash on delivery</div>}
      </section>

      {o.status !== 'out_for_delivery' ? (
        <button className="btn primary lg job-step" onClick={next}><Check size={20} aria-hidden="true" /> {o.status === 'delivery_assigned' ? 'Confirm pickup' : 'Start delivery'}</button>
      ) : (
        <form onSubmit={complete} className="card block stack" noValidate>
          <div className="field">
            <label htmlFor="otp">Customer's delivery code</label>
            <input id="otp" className="input otp" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(err)} aria-describedby={err ? 'otp-err' : 'otp-hint'} />
            <span id="otp-hint" className="muted" style={{ fontSize: '0.85rem' }}>Demo code: {deliveryCode(o)}</span>
            {err && <span id="otp-err" className="error-text" role="alert">{err}</span>}
          </div>
          <button className="btn primary lg job-step" type="submit" disabled={code.length < 4}>Confirm delivery</button>
        </form>
      )}
      <button className="btn danger lg" onClick={() => setReporting(true)}><AlertTriangle size={18} aria-hidden="true" /> Report a problem</button>

      {reporting && (
        <Modal title="Report a problem" onClose={() => setReporting(false)}>
          <div className="stack">
            {['Restaurant delay', 'Customer unavailable', 'Incorrect address', 'Damaged order', 'Unsafe to deliver'].map((x) => (
              <button key={x} className="btn" onClick={() => { reportException(o.id, x); setReporting(false); toast('Reported to support'); }}>{x}</button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

export function DeliveryHistory() {
  const { done } = useMe();
  const { restaurants } = useApp();
  if (!done.length) return <Empty icon={PackageCheck} title="No completed deliveries yet" />;
  return (
    <>
      <h2>Completed deliveries</h2>
      {[...done].reverse().map((o) => (
        <div key={o.id} className="card row between" style={{ flexWrap: 'nowrap' }}>
          <div><strong>{o.orderNumber}</strong><div className="muted">{restaurants.find((r) => r.id === o.restaurantId)?.name} · {timeAgo(o.history.at(-1).at)}</div></div>
          <strong>{money(earningFor(o))}</strong>
        </div>
      ))}
    </>
  );
}

export function DeliveryEarnings() {
  const { done } = useMe();
  const week = 2 * 24 * 60 * 60 * 1000;
  const settled = done.filter((o) => Date.now() - new Date(o.history.at(-1).at).getTime() > week);
  const pending = done.filter((o) => !settled.includes(o));
  const sum = (l) => l.reduce((s, o) => s + earningFor(o), 0);
  return (
    <>
      <h2>Earnings</h2>
      <div className="grid cols-2">
        <div className="card kpi"><span className="label">Paid out</span><span className="value">{money(sum(settled))}</span></div>
        <div className="card kpi"><span className="label">Payout pending</span><span className="value">{money(sum(pending))}</span></div>
      </div>
      <p className="muted">Earnings per trip are 80% of the delivery fee plus a ₹10 base. Payout status is tracked separately from delivery status and is calculated on the server in the real app.</p>
    </>
  );
}
