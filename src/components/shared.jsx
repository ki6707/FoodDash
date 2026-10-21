import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Cake, Check, Pizza, Salad, Sandwich, Soup, Star, Utensils, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STATUS_META, TIMELINE, timeAgo } from '../utils/orderStatus';

const CAT_ICON = { pizza: Pizza, biryani: Utensils, burger: Sandwich, south: Salad, chinese: Soup, dessert: Cake };

export function Cover({ color, category, imageUrl, size = 44, className = '', label }) {
  const Icon = CAT_ICON[category] ?? Utensils;
  return (
    <div
      className={`cover${imageUrl ? ' has-image' : ''} ${className}`}
      style={{ background: color }}
      role={imageUrl ? undefined : 'img'}
      aria-label={imageUrl ? undefined : label ?? 'Food category illustration'}
    >
      {imageUrl ? <img src={imageUrl} alt={label ?? 'Prepared food'} loading="lazy" decoding="async" /> : <Icon size={size} strokeWidth={1.6} aria-hidden="true" />}
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral', icon: Check };
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.tone}`}>
      <Icon size={14} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const map = {
    paid: ['success', 'Paid'], pending: ['warning', 'Pay on delivery'], refund_due: ['warning', 'Refund due'],
    refunded: ['neutral', 'Refunded'], void: ['neutral', 'No charge'],
  };
  const [tone, label] = map[status] ?? ['neutral', status];
  return <span className={`badge ${tone}`}>{label}</span>;
}

export function Rating({ value }) {
  if (!value) return <span className="badge neutral">New</span>;
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5`}>
      <Star size={12} fill="currentColor" aria-hidden="true" /> {value.toFixed(1)}
    </span>
  );
}

export function OrderTimeline({ order }) {
  const reached = new Set(order.history.map((h) => h.to));
  const ended = ['rejected', 'cancelled', 'refund_pending', 'refunded'].find((s) => reached.has(s));
  const steps = ended ? order.history.map((h) => h.to) : TIMELINE;
  const currentIdx = steps.indexOf(order.status);
  return (
    <ol className="timeline" aria-label="Order progress">
      {steps.map((s, i) => {
        const meta = STATUS_META[s];
        const Icon = meta.icon;
        const entry = order.history.find((h) => h.to === s);
        const cls = i < currentIdx || order.status === 'delivered' ? 'done' : i === currentIdx ? 'current' : 'pending';
        return (
          <li key={s} className={cls} aria-current={cls === 'current' ? 'step' : undefined}>
            <span className="dot">{cls === 'done' ? <Check size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}</span>
            <div>
              <strong>{meta.label}</strong>
              {entry && <div className="muted" style={{ fontSize: '0.85rem' }}>{timeAgo(entry.at)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      <Icon size={44} aria-hidden="true" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/** Role gate. The real security check must repeat on the server for every API call. */
export function ProtectedRoute({ role, children }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?role=${role}`} state={{ from: loc.pathname }} replace />;
  if (user.role !== role) return <Navigate to="/login" replace state={{ denied: true }} />;
  return children;
}
