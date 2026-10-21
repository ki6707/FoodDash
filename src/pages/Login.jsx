import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bike, ShieldCheck, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { demoAccounts } from '../data/mock';

const ROLES = [
  { id: 'customer', label: 'Customer', icon: ShoppingBag, home: '/restaurants' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, home: '/admin/dashboard' },
  { id: 'delivery', label: 'Delivery', icon: Bike, home: '/delivery/dashboard' },
];

export default function Login() {
  const [params] = useSearchParams();
  const loc = useLocation();
  const nav = useNavigate();
  const { login } = useApp();
  const [role, setRole] = useState(params.get('role') ?? 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const current = ROLES.find((r) => r.id === role);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    // Prototype: any valid-looking credentials work. Real app: POST /api/auth/login.
    login(role);
    nav(loc.state?.from?.startsWith(`/${role}`) ? loc.state.from : current.home, { replace: true });
  };

  const demo = () => {
    login(role);
    nav(current.home, { replace: true });
  };

  return (
    <div className="login-wrap">
      <div className="card block login-card stack">
        <Link to="/" className="brand"><UtensilsCrossed aria-hidden="true" /> FoodDash</Link>
        <div>
          <h2>Welcome back</h2>
          <p className="muted">Choose your portal and sign in.</p>
        </div>
        {loc.state?.denied && <div className="badge danger" role="alert">That page needs a different role. Please sign in with the right portal.</div>}
        <div className="role-tabs" role="group" aria-label="Portal">
          {ROLES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className="chip" aria-pressed={role === id} onClick={() => setRole(id)} style={{ justifyContent: 'center' }}>
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="stack" noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-err' : undefined} placeholder={demoAccounts[role].email} />
            {errors.email && <span id="email-err" className="error-text">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'pw-err' : undefined} />
            {errors.password && <span id="pw-err" className="error-text">{errors.password}</span>}
          </div>
          <button className="btn primary lg" type="submit">Sign in as {current.label.toLowerCase()}</button>
        </form>
        <button className="btn lg" type="button" onClick={demo}>Skip with demo {current.label.toLowerCase()} account</button>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>Prototype only: no real authentication happens here. The backend will enforce roles on every API call.</p>
      </div>
    </div>
  );
}
