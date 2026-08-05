import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Schedule } from './pages/Schedule.jsx';
import { Bookings } from './pages/Bookings.jsx';
import { Placeholder } from './pages/Placeholder.jsx';

const api = (path, opts = {}) => fetch(`/api${path}`, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  ...opts,
}).then(async r => {
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error || r.statusText), { status: r.status });
  return body;
});

export { api };

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <BrowserRouter>
      <div className="shell">
        <aside className="sidebar">
          <h1>Encore</h1>
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/schedule">Schedule</NavLink>
            <NavLink to="/coaches">Coaches</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/bookings">Bookings</NavLink>
            {user.role === 'owner' && <NavLink to="/audit">Audit log</NavLink>}
          </nav>
          <div className="user">
            <div>{user.name || user.email}</div>
            <button onClick={() => api('/admin/logout', { method: 'POST' }).then(() => setUser(null))}>Sign out</button>
          </div>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/coaches" element={<Placeholder name="Coaches" />} />
            <Route path="/events" element={<Placeholder name="Events" />} />
            <Route path="/gallery" element={<Placeholder name="Gallery" />} />
            <Route path="/bookings" element={<Bookings />} />
            {user.role === 'owner' && <Route path="/audit" element={<Placeholder name="Audit log" />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
