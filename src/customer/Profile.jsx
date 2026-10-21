import { useState } from 'react';
import { Headset, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { savedAddresses } from '../data/mock';

export default function Profile() {
  const { user, toast } = useApp();
  const [subject, setSubject] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!subject.trim() || !msg.trim()) return setErr('Please add a subject and a short description.');
    setErr('');
    setSubject(''); setMsg('');
    toast('Support request sent. We will reply by email.');
  };

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>Profile</h1>
      <section className="card"><h3>{user.name}</h3><p className="muted" style={{ margin: 0 }}>{user.email} · {user.phone}</p></section>
      <section className="card stack" aria-labelledby="addr">
        <h3 id="addr"><MapPin size={18} aria-hidden="true" style={{ verticalAlign: -3 }} /> Saved addresses</h3>
        {savedAddresses.map((a) => (
          <div key={a.id} className="row between">
            <div><strong>{a.label}</strong> {a.isDefault && <span className="badge info">Default</span>}<div className="muted">{a.line}, {a.city} {a.postalCode}</div></div>
          </div>
        ))}
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Add, edit and delete will call /api/addresses once the backend is connected.</p>
      </section>
      <section className="card stack" aria-labelledby="help">
        <h3 id="help"><Headset size={18} aria-hidden="true" style={{ verticalAlign: -3 }} /> Help & support</h3>
        <form onSubmit={send} className="stack" noValidate>
          <div className="field"><label htmlFor="sub">Subject</label><input id="sub" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div className="field"><label htmlFor="msg">What happened?</label><textarea id="msg" className="input" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
          {err && <span className="error-text" role="alert">{err}</span>}
          <button className="btn primary" type="submit">Send to support</button>
        </form>
      </section>
    </div>
  );
}
