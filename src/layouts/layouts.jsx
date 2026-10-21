import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgePercent, BarChart3, Bike, ClipboardList, CreditCard, Home,
  LayoutDashboard, LogOut, Menu, Receipt, ShoppingBag, Store, User,
  UtensilsCrossed, Users, Wallet, X, History, Inbox, Navigation, Phone, Mail, MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/* ─── Customer Layout ─────────────────────────────── */
export function CustomerLayout() {
  const { cartCount, user, logout } = useApp();
  const nav = useNavigate();
  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>
      <header className="topbar">
        <div className="container">
          <Link to="/" className="brand">
            <UtensilsCrossed size={26} aria-hidden="true" />
            FoodDash
          </Link>
          <nav className="nav-links grow" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Home size={16} aria-hidden="true" /><span className="nav-text">Home</span>
            </NavLink>
            <NavLink to="/restaurants" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Store size={16} aria-hidden="true" /><span className="nav-text">Restaurants</span>
            </NavLink>
            {user?.role === 'customer' && (
              <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Receipt size={16} aria-hidden="true" /><span className="nav-text">Orders</span>
              </NavLink>
            )}
          </nav>
            <div className="topbar-actions">
            <Link to="/cart" className="cart-pill" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag size={16} aria-hidden="true" />
              <span className="nav-text">Cart</span>
              <span className="cart-count">{cartCount}</span>
            </Link>
            {user?.role === 'customer' ? (
              <>
                <Link to="/profile" className="icon-btn" aria-label="Your profile">
                  <User size={18} />
                </Link>
                <button
                  className="icon-btn"
                  aria-label="Log out"
                  onClick={() => { logout(); nav('/'); }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login?role=customer" className="btn primary sm">Log in</Link>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="page">
        <div className="container"><Outlet /></div>
      </main>

      <CustomerFooter />
    </>
  );
}

function CustomerFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <UtensilsCrossed size={28} aria-hidden="true" />
              FoodDash
            </div>
            <p className="footer-desc">
              Tiruchirappalli's favourite food delivery platform. Order from top-rated local
              restaurants and get your food delivered hot and fresh to your door.
            </p>
          </div>
          <div>
            <p className="footer-heading">Discover</p>
            <ul className="footer-links">
              <li><Link to="/restaurants">All Restaurants</Link></li>
              <li><Link to="/restaurants?category=biryani">Biryani</Link></li>
              <li><Link to="/restaurants?category=pizza">Pizza</Link></li>
              <li><Link to="/restaurants?category=south">South Indian</Link></li>
              <li><Link to="/restaurants?category=dessert">Desserts</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">Company</p>
            <ul className="footer-links">
              <li><Link to="/login?role=admin">Partner with us</Link></li>
              <li><Link to="/login?role=delivery">Deliver with us</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">Contact</p>
            <ul className="footer-links">
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={14} /><span>Tiruchirappalli, Tamil Nadu</span>
              </li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Phone size={14} /><a href="tel:+919000011111">+91 90000 11111</a>
              </li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Mail size={14} /><a href="mailto:support@fooddash.test">support@fooddash.test</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 FoodDash. All rights reserved. · Prototype — demo data only.</span>
            <span>Made for the neighborhoods of Tiruchirappalli</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Admin Layout ────────────────────────────────── */
const ADMIN_LINKS = [
  ['/admin/dashboard', 'Dashboard', LayoutDashboard],
  ['/admin/orders', 'Orders', ClipboardList],
  ['/admin/restaurants', 'Restaurants', Store],
  ['/admin/menu', 'Menu items', UtensilsCrossed],
  ['/admin/delivery-partners', 'Delivery partners', Bike],
  ['/admin/customers', 'Customers', Users],
  ['/admin/payments', 'Payments', CreditCard],
  ['/admin/coupons', 'Coupons', BadgePercent],
  ['/admin/reports', 'Reports & audit', BarChart3],
];

export function AdminLayout() {
  const { logout, user, resetDemo } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div className="shell">
      {/* Overlay for mobile */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="row between sidebar-brand">
          <Link to="/admin/dashboard" className="brand" style={{ color: '#fff', fontSize: '1.25rem' }}>
            <UtensilsCrossed size={24} aria-hidden="true" /> FoodDash
          </Link>
          <button className="icon-btn menu-toggle" style={{ background: 'transparent', color: '#fecaca', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <p className="sidebar-section">Operations</p>
        {ADMIN_LINKS.slice(0, 5).map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
            <Icon size={18} aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <p className="sidebar-section">Finance</p>
        {ADMIN_LINKS.slice(5).map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
            <Icon size={18} aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'grid', gap: 4 }}>
          <button className="side-link" style={{ background: 'none', border: 'none', textAlign: 'left', color: '#fecaca' }} onClick={resetDemo}>
            <Inbox size={18} aria-hidden="true" /> Reset demo data
          </button>
          <button className="side-link" style={{ background: 'none', border: 'none', textAlign: 'left', color: '#fecaca' }} onClick={() => { logout(); nav('/login?role=admin'); }}>
            <LogOut size={18} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>
      <div className="shell-main">
        <div className="shell-header">
          <div className="row">
            <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                Signed in as <strong>{user?.name}</strong>
              </span>
              <span className="badge neutral" style={{ marginLeft: 8 }}>Operations Admin</span>
            </div>
          </div>
          <Link to="/" className="btn sm ghost">
            <Store size={16} aria-hidden="true" /> View storefront
          </Link>
        </div>
        <main><Outlet /></main>
      </div>
    </div>
  );
}

/* ─── Delivery Layout ────────────────────────────── */
const DELIVERY_LINKS = [
  ['/delivery/dashboard', 'Home', Home],
  ['/delivery/requests', 'Offers', Inbox],
  ['/delivery/active', 'Active', Navigation],
  ['/delivery/history', 'History', History],
  ['/delivery/earnings', 'Earnings', Wallet],
];

export function DeliveryLayout() {
  const { logout, user } = useApp();
  const nav = useNavigate();
  return (
    <div className="delivery-shell">
      <header className="delivery-head">
        <span className="brand"><Bike size={22} aria-hidden="true" /> FoodDash Rider</span>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{user?.name}</span>
          <button
            className="icon-btn"
            aria-label="Log out"
            style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            onClick={() => { logout(); nav('/login?role=delivery'); }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="delivery-body"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Delivery navigation">
        <div className="inner">
          {DELIVERY_LINKS.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={22} aria-hidden="true" />{label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
