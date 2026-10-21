import { useMemo, useState } from 'react';
import { Ban, Bike, CheckCircle2, ClipboardList, IndianRupee, Plus, Search, ShieldCheck, Timer, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, PaymentBadge, StatusBadge } from '../components/shared';
import { STATUS_META, TERMINAL, money, timeAgo } from '../utils/orderStatus';

const PageTitle = ({ title, action, sub }) => (
  <div className="row between" style={{ marginBottom: 16 }}>
    <div><h1 style={{ margin: 0 }}>{title}</h1>{sub && <p className="muted" style={{ margin: 0 }}>{sub}</p>}</div>
    {action}
  </div>
);

function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="card kpi">
      <span className="icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="value">{value}</span>
      <span className="label">{label}</span>
      {hint && <span className="muted" style={{ fontSize: '0.8rem' }}>{hint}</span>}
    </div>
  );
}

const salesOf = (orders) => orders.filter((o) => !['cancelled', 'rejected'].includes(o.status)).reduce((s, o) => s + o.total, 0);

/* ---------------- Dashboard ---------------- */
export function AdminDashboard() {
  const { orders, restaurants, partners } = useApp();
  const pending = orders.filter((o) => o.status === 'placed').length;
  const active = orders.filter((o) => !TERMINAL.includes(o.status) && o.status !== 'refund_pending').length;
  const cancelled = orders.filter((o) => ['cancelled', 'rejected'].includes(o.status)).length;
  const online = partners.filter((p) => p.online && p.verified).length;

  const byRest = restaurants.map((r) => ({ name: r.name, value: salesOf(orders.filter((o) => o.restaurantId === r.id)) })).filter((x) => x.value > 0);
  const max = Math.max(1, ...byRest.map((x) => x.value));

  return (
    <div className="stack">
      <PageTitle title="Dashboard" sub="Live view of today's operations" />
      <div className="grid cols-4">
        <Kpi icon={ClipboardList} label="Total orders" value={orders.length} />
        <Kpi icon={IndianRupee} label="Sales (excl. cancelled)" value={money(salesOf(orders))} />
        <Kpi icon={Timer} label="Awaiting acceptance" value={pending} hint={pending ? 'Needs action' : 'All caught up'} />
        <Kpi icon={Bike} label="Active deliveries" value={active} hint={`${online} partners online`} />
        <Kpi icon={Ban} label="Cancelled / rejected" value={cancelled} />
      </div>
      <div className="card">
        <h3>Sales by restaurant</h3>
        <div className="bars" role="img" aria-label={`Sales by restaurant: ${byRest.map((b) => `${b.name} ${money(b.value)}`).join(', ')}`}>
          {byRest.map((b) => (
            <div key={b.name} className="bar-col">
              <div style={{ display: 'flex', alignItems: 'flex-end' }}><div className="bar" style={{ height: `${(b.value / max) * 100}%`, width: '100%' }} /></div>
              <div><div className="v">{money(b.value)}</div><div className="muted">{b.name}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>Recent orders</h3>
        <OrdersTable list={orders.slice(0, 6)} />
      </div>
    </div>
  );
}

function OrdersTable({ list, actions }) {
  const { restaurants } = useApp();
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Restaurant</th><th>Total</th><th>Payment</th><th>Status</th>{actions && <th>Actions</th>}</tr></thead>
        <tbody>
          {list.map((o) => (
            <tr key={o.id}>
              <td><strong>{o.orderNumber}</strong><div className="muted" style={{ fontSize: '0.8rem' }}>{timeAgo(o.createdAt)}</div></td>
              <td>{o.customerName}</td>
              <td>{restaurants.find((r) => r.id === o.restaurantId)?.name}</td>
              <td>{money(o.total)}</td>
              <td><PaymentBadge status={o.paymentStatus} /></td>
              <td><StatusBadge status={o.status} /></td>
              {actions && <td>{actions(o)}</td>}
            </tr>
          ))}
          {!list.length && <tr><td colSpan={actions ? 7 : 6} className="muted">No orders match.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Orders ---------------- */
export function AdminOrders() {
  const { orders, partners, transitionOrder, assignPartner, logAudit, toast } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [assigning, setAssigning] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const list = useMemo(() => orders.filter((o) => (status === 'all' || o.status === status)
    && (!q || `${o.orderNumber} ${o.customerName}`.toLowerCase().includes(q.toLowerCase()))), [orders, q, status]);

  const act = (o, to, label, tone = '') => (
    <button key={to} className={`btn sm ${tone}`} onClick={() => {
      if (to === 'cancelled' || to === 'rejected' || to === 'refunded') return setConfirm({ o, to, label });
      transitionOrder(o.id, to, 'admin'); logAudit(label, o.orderNumber); toast(`${o.orderNumber}: ${STATUS_META[to].label}`);
    }}>{label}</button>
  );

  const actions = (o) => (
    <div className="row" style={{ gap: 6 }}>
      {o.status === 'placed' && <>{act(o, 'confirmed', 'Accept', 'primary')}{act(o, 'rejected', 'Reject', 'danger')}</>}
      {o.status === 'confirmed' && act(o, 'preparing', 'Start preparing', 'primary')}
      {o.status === 'preparing' && act(o, 'ready_for_pickup', 'Mark ready', 'primary')}
      {o.status === 'ready_for_pickup' && <button className="btn sm primary" onClick={() => setAssigning(o)}>Assign rider</button>}
      {(o.status === 'cancelled' || o.status === 'rejected') && o.paymentStatus === 'refund_due' && act(o, 'refund_pending', 'Start refund')}
      {o.status === 'refund_pending' && act(o, 'refunded', 'Confirm refunded')}
      {['confirmed'].includes(o.status) && act(o, 'cancelled', 'Cancel', 'danger')}
      <button className="btn sm ghost" onClick={() => setDetail(o)}>History</button>
    </div>
  );

  const available = partners.filter((p) => p.verified && p.status === 'active' && p.online);

  return (
    <div className="stack">
      <PageTitle title="Orders" sub="Every status change is validated against the allowed transitions and logged." />
      <div className="search-row">
        <label className="sr-only" htmlFor="oq">Search orders</label>
        <input id="oq" className="input" placeholder="Search by order number or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="os">Filter by status</label>
        <select id="os" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <OrdersTable list={list} actions={actions} />

      {assigning && (
        <Modal title={`Assign rider · ${assigning.orderNumber}`} onClose={() => setAssigning(null)}>
          {available.length ? available.map((p) => (
            <div key={p.id} className="row between" style={{ padding: '8px 0' }}>
              <div><strong>{p.name}</strong><div className="muted">★ {p.rating} · {p.trips} trips</div></div>
              <button className="btn sm primary" onClick={() => { assignPartner(assigning.id, p.id); toast(`Assigned ${p.name}`); setAssigning(null); }}>Assign</button>
            </div>
          )) : <p className="muted">No verified riders are online right now.</p>}
        </Modal>
      )}
      {detail && (
        <Modal title={`${detail.orderNumber} timeline`} onClose={() => setDetail(null)}>
          {[...detail.history].reverse().map((h, i) => (
            <div key={i} className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <StatusBadge status={h.to} /><span className="muted">by {h.actor} · {timeAgo(h.at)}</span>
            </div>
          ))}
        </Modal>
      )}
      {confirm && (
        <Modal title="Please confirm" onClose={() => setConfirm(null)}>
          <p>{confirm.label} for <strong>{confirm.o.orderNumber}</strong>? This is recorded in the audit log{confirm.to === 'refunded' ? ' and marks the payment as refunded' : ''}.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setConfirm(null)}>Go back</button>
            <button className="btn primary" onClick={() => { transitionOrder(confirm.o.id, confirm.to, 'admin'); logAudit(confirm.label, confirm.o.orderNumber); toast(`${confirm.o.orderNumber}: ${STATUS_META[confirm.to].label}`); setConfirm(null); }}>Confirm</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Restaurants ---------------- */
export function AdminRestaurants() {
  const { restaurants, setRestaurants, logAudit, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', cuisine: '', area: '' });
  const [err, setErr] = useState('');

  const patch = (id, change, label) => {
    setRestaurants((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)));
    logAudit(label, restaurants.find((r) => r.id === id).name);
    toast(label);
  };
  const add = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cuisine.trim() || !form.area.trim()) return setErr('Name, cuisine and area are required.');
    setRestaurants((rs) => [...rs, { id: `r${rs.length + 1}-${Date.now() % 1000}`, name: form.name.trim(), cuisine: form.cuisine.split(',').map((s) => s.trim()), category: 'biryani', rating: 0, eta: 0, fee: 30, priceFor2: 400, area: form.area.trim(), open: false, veg: false, approval: 'pending', color: '#92400e' }]);
    logAudit('Created restaurant', form.name);
    setAdding(false); setForm({ name: '', cuisine: '', area: '' }); setErr('');
  };

  return (
    <div className="stack">
      <PageTitle title="Restaurants" action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> Add restaurant</button>} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Area</th><th>Approval</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong><div className="muted">{r.cuisine.join(', ')}</div></td>
                <td>{r.area}</td>
                <td><span className={`badge ${r.approval === 'approved' ? 'success' : r.approval === 'pending' ? 'warning' : 'danger'}`}>{r.approval}</span></td>
                <td>{r.open ? <span className="badge success">Open</span> : <span className="badge neutral">Closed</span>}</td>
                <td className="row" style={{ gap: 6 }}>
                  {r.approval === 'pending' && <button className="btn sm primary" onClick={() => patch(r.id, { approval: 'approved', open: true, eta: 35 }, 'Approved restaurant')}>Approve</button>}
                  {r.approval === 'approved' && <button className="btn sm" onClick={() => patch(r.id, { open: !r.open }, r.open ? 'Closed restaurant' : 'Opened restaurant')}>{r.open ? 'Close' : 'Open'}</button>}
                  {r.approval === 'approved' && <button className="btn sm danger" onClick={() => patch(r.id, { approval: 'suspended', open: false }, 'Suspended restaurant')}>Suspend</button>}
                  {r.approval === 'suspended' && <button className="btn sm" onClick={() => patch(r.id, { approval: 'approved' }, 'Reinstated restaurant')}>Reinstate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && (
        <Modal title="Add restaurant" onClose={() => setAdding(false)}>
          <form onSubmit={add} className="stack" noValidate>
            {[['name', 'Name'], ['cuisine', 'Cuisines (comma separated)'], ['area', 'Area']].map(([k, label]) => (
              <div key={k} className="field"><label htmlFor={`f-${k}`}>{label}</label><input id={`f-${k}`} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
            ))}
            {err && <span className="error-text" role="alert">{err}</span>}
            <button className="btn primary" type="submit">Create (pending approval)</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Menu ---------------- */
export function AdminMenu() {
  const { restaurants, foods, setFoods, logAudit, toast } = useApp();
  const [rid, setRid] = useState(restaurants[0].id);
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', section: '', veg: true });
  const [err, setErr] = useState('');
  const items = foods.filter((f) => f.restaurantId === rid);

  const save = (e) => {
    e.preventDefault();
    const price = Number(edit.price);
    if (!(price > 0)) return setErr('Enter a price greater than zero.');
    setFoods((fs) => fs.map((f) => (f.id === edit.id ? { ...f, price } : f)));
    logAudit('Changed price', `${edit.name} → ${money(price)}`);
    setEdit(null); setErr('');
  };
  const addItem = (e) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !form.section.trim() || !(price > 0)) return setErr('Name, section and a valid price are required.');
    setFoods((fs) => [...fs, { id: `${rid}-n${Date.now()}`, restaurantId: rid, name: form.name.trim(), section: form.section.trim(), price, veg: form.veg, description: 'New item', isAvailable: true }]);
    logAudit('Added menu item', form.name);
    setAdding(false); setForm({ name: '', price: '', section: '', veg: true }); setErr('');
  };

  return (
    <div className="stack">
      <PageTitle title="Menu items" action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> Add item</button>} />
      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="rid">Restaurant</label>
        <select id="rid" className="input" value={rid} onChange={(e) => setRid(e.target.value)}>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Section</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id}>
                <td><strong>{f.name}</strong> {f.veg ? <span className="badge success">Veg</span> : <span className="badge danger">Non-veg</span>}</td>
                <td>{f.section}</td>
                <td>{money(f.price)}</td>
                <td>
                  <button className="switch" role="switch" aria-checked={f.isAvailable} aria-label={`${f.name} available`} onClick={() => { setFoods((fs) => fs.map((x) => (x.id === f.id ? { ...x, isAvailable: !x.isAvailable } : x))); logAudit(f.isAvailable ? 'Disabled item' : 'Enabled item', f.name); }} />
                </td>
                <td><button className="btn sm" onClick={() => setEdit({ ...f })}>Edit price</button></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="muted">No items yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => { setEdit(null); setErr(''); }}>
          <form onSubmit={save} className="stack" noValidate>
            <div className="field"><label htmlFor="pr">Price (₹)</label><input id="pr" className="input" inputMode="decimal" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></div>
            {err && <span className="error-text" role="alert">{err}</span>}
            <p className="muted" style={{ margin: 0 }}>Existing orders keep the price they were placed at.</p>
            <button className="btn primary" type="submit">Save</button>
          </form>
        </Modal>
      )}
      {adding && (
        <Modal title="Add menu item" onClose={() => { setAdding(false); setErr(''); }}>
          <form onSubmit={addItem} className="stack" noValidate>
            <div className="field"><label htmlFor="an">Name</label><input id="an" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="as">Section</label><input id="as" className="input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div>
            <div className="field"><label htmlFor="ap">Price (₹)</label><input id="ap" className="input" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <label className="row"><input type="checkbox" checked={form.veg} onChange={(e) => setForm({ ...form, veg: e.target.checked })} /> Vegetarian</label>
            {err && <span className="error-text" role="alert">{err}</span>}
            <button className="btn primary" type="submit">Add item</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Delivery partners ---------------- */
export function AdminDeliveryPartners() {
  const { partners, setPartners, logAudit, toast } = useApp();
  const patch = (p, change, label) => { setPartners((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...change } : x))); logAudit(label, p.name); toast(`${label}: ${p.name}`); };
  return (
    <div className="stack">
      <PageTitle title="Delivery partners" sub="Only verified, active partners can receive jobs." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Partner</th><th>Vehicle</th><th>Rating</th><th>Trips</th><th>Verification</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><div className="muted">{p.phone}</div></td>
                <td>{p.vehicle}</td><td>{p.rating || '—'}</td><td>{p.trips}</td>
                <td>{p.verified ? <span className="badge success"><ShieldCheck size={14} aria-hidden="true" /> Verified</span> : <span className="badge warning">Pending</span>}</td>
                <td>{p.status !== 'active' ? <span className="badge neutral">Inactive</span> : p.online ? <span className="badge success">Online</span> : <span className="badge neutral">Offline</span>}</td>
                <td className="row" style={{ gap: 6 }}>
                  {!p.verified && <button className="btn sm primary" onClick={() => patch(p, { verified: true, status: 'active' }, 'Verified partner')}>Verify</button>}
                  {p.verified && p.status === 'active' && <button className="btn sm danger" onClick={() => patch(p, { status: 'suspended', online: false }, 'Suspended partner')}>Suspend</button>}
                  {p.status === 'suspended' && <button className="btn sm" onClick={() => patch(p, { status: 'active' }, 'Reactivated partner')}>Reactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Customers ---------------- */
export function AdminCustomers() {
  const { orders } = useApp();
  const map = new Map();
  orders.forEach((o) => {
    const c = map.get(o.customerId) ?? { id: o.customerId, name: o.customerName, orders: 0, spent: 0, last: o.createdAt };
    c.orders += 1; if (!['cancelled', 'rejected'].includes(o.status)) c.spent += o.total;
    if (o.createdAt > c.last) c.last = o.createdAt;
    map.set(o.customerId, c);
  });
  return (
    <div className="stack">
      <PageTitle title="Customers" sub="Contact details are hidden here to keep personal data to a minimum." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead>
          <tbody>{[...map.values()].map((c) => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.orders}</td><td>{money(c.spent)}</td><td>{timeAgo(c.last)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Payments ---------------- */
export function AdminPayments() {
  const { orders, restaurants } = useApp();
  const paid = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const due = orders.filter((o) => ['refund_due'].includes(o.paymentStatus) || o.status === 'refund_pending').reduce((s, o) => s + o.total, 0);
  return (
    <div className="stack">
      <PageTitle title="Payments" sub="Read-only records. Refunds are started and confirmed from the Orders page and audit-logged." />
      <div className="grid cols-4">
        <Kpi icon={Wallet} label="Collected" value={money(paid)} />
        <Kpi icon={CheckCircle2} label="Refunds outstanding" value={money(due)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Restaurant</th><th>Method</th><th>Amount</th><th>Payment</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id}><td>{o.orderNumber}</td><td>{restaurants.find((r) => r.id === o.restaurantId)?.name}</td><td>{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}</td><td>{money(o.total)}</td><td><PaymentBadge status={o.paymentStatus} /></td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Coupons ---------------- */
export function AdminCoupons() {
  const { coupons, setCoupons, logAudit, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ code: '', type: 'percent', value: '', max: '', minOrder: '', validUntil: '' });
  const [err, setErr] = useState('');
  const add = (e) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return setErr('Code must be 4-12 letters or numbers.');
    if (coupons.some((c) => c.code === code)) return setErr('That code already exists.');
    if (!(Number(f.value) > 0) || (f.type === 'percent' && Number(f.value) > 100)) return setErr('Enter a valid discount value.');
    if (!f.validUntil) return setErr('Choose an expiry date.');
    setCoupons((cs) => [...cs, { id: `c${Date.now()}`, code, type: f.type, value: Number(f.value), max: Number(f.max) || Number(f.value), minOrder: Number(f.minOrder) || 0, validUntil: f.validUntil, usageLimit: 500, used: 0, active: true }]);
    logAudit('Created coupon', code); toast(`Coupon ${code} created`);
    setAdding(false); setErr(''); setF({ code: '', type: 'percent', value: '', max: '', minOrder: '', validUntil: '' });
  };
  return (
    <div className="stack">
      <PageTitle title="Coupons" action={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> New coupon</button>} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Valid until</th><th>Used</th><th>Active</th></tr></thead>
          <tbody>{coupons.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.code}</strong></td>
              <td>{c.type === 'percent' ? `${c.value}% (max ${money(c.max)})` : money(c.value)}</td>
              <td>{money(c.minOrder)}</td><td>{c.validUntil}</td><td>{c.used}/{c.usageLimit}</td>
              <td><button className="switch" role="switch" aria-checked={c.active} aria-label={`${c.code} active`} onClick={() => { setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))); logAudit(c.active ? 'Deactivated coupon' : 'Activated coupon', c.code); }} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {adding && (
        <Modal title="New coupon" onClose={() => { setAdding(false); setErr(''); }}>
          <form onSubmit={add} className="stack" noValidate>
            <div className="field"><label htmlFor="cc">Code</label><input id="cc" className="input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
            <div className="field"><label htmlFor="ct">Type</label><select id="ct" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Percent</option><option value="flat">Flat amount</option></select></div>
            <div className="field"><label htmlFor="cv">Value</label><input id="cv" className="input" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
            <div className="field"><label htmlFor="cm">Max discount (₹)</label><input id="cm" className="input" inputMode="decimal" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></div>
            <div className="field"><label htmlFor="co">Minimum order (₹)</label><input id="co" className="input" inputMode="decimal" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} /></div>
            <div className="field"><label htmlFor="cd">Valid until</label><input id="cd" type="date" className="input" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} /></div>
            {err && <span className="error-text" role="alert">{err}</span>}
            <button className="btn primary" type="submit">Create coupon</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Reports & audit ---------------- */
export function AdminReports() {
  const { orders, audit } = useApp();
  const counts = Object.entries(STATUS_META).map(([k, v]) => ({ k, label: v.label, n: orders.filter((o) => o.status === k).length })).filter((x) => x.n);
  const max = Math.max(1, ...counts.map((c) => c.n));
  const avg = orders.length ? salesOf(orders) / orders.filter((o) => !['cancelled', 'rejected'].includes(o.status)).length : 0;

  const exportCsv = () => {
    const rows = [['order', 'customer', 'total', 'payment', 'status'], ...orders.map((o) => [o.orderNumber, o.customerName, o.total, o.paymentStatus, o.status])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack">
      <PageTitle title="Reports & audit log" action={<button className="btn" onClick={exportCsv}>Export orders CSV</button>} />
      <div className="grid cols-4">
        <Kpi icon={IndianRupee} label="Average order value" value={money(Math.round(avg || 0))} />
        <Kpi icon={Search} label="Audit entries" value={audit.length} />
      </div>
      <div className="card">
        <h3>Orders by status</h3>
        <div className="stack">
          {counts.map((c) => (
            <div key={c.k} className="row" style={{ flexWrap: 'nowrap' }}>
              <span style={{ width: 140 }}>{c.label}</span>
              <div style={{ flex: 1, background: 'var(--color-muted)', borderRadius: 8 }}><div className="bar" style={{ width: `${(c.n / max) * 100}%`, height: 14, borderRadius: 8, minHeight: 14 }} /></div>
              <strong style={{ width: 24, textAlign: 'right' }}>{c.n}</strong>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>Audit log</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>
              {audit.map((a) => <tr key={a.id}><td>{timeAgo(a.at)}</td><td>{a.actor}</td><td>{a.action}</td><td>{a.detail}</td></tr>)}
              {!audit.length && <tr><td colSpan={4} className="muted">No privileged actions yet. Accept an order or change a price to see entries here.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
