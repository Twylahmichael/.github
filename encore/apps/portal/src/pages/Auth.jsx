import React, { useState } from 'react';
import { api } from '../api.js';

export function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');       // 'login' | 'signup'
  const [form, setForm] = useState({ phone: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { member } = await api(`/members/${mode}`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onAuth(member);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={submit}>
        <div className="brand-large">Encore</div>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
        </div>

        <label>Phone number
          <input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" required />
        </label>

        {mode === 'signup' && (
          <>
            <label>Full name
              <input value={form.name} onChange={set('name')} required />
            </label>
            <label>Email <span className="muted">(optional, for password reset)</span>
              <input type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            </label>
          </>
        )}

        <label>Password
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                 value={form.password} onChange={set('password')} minLength={8} required />
        </label>

        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? '…' : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>

        <p className="muted small">
          {mode === 'login' ? "New to Encore? " : 'Already have an account? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  );
}
