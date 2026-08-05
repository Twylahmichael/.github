import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { api } from './api.js';
import { Auth } from './pages/Auth.jsx';
import { Book } from './pages/Book.jsx';
import { Calendar } from './pages/Calendar.jsx';

export function App() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/members/me')
      .then(({ member }) => setMember(member))
      .catch(() => setMember(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;
  if (!member) return <Auth onAuth={setMember} />;

  return (
    <BrowserRouter>
      <header className="header">
        <div className="brand">Encore</div>
        <nav>
          <NavLink to="/">My calendar</NavLink>
          <NavLink to="/book">Book a class</NavLink>
        </nav>
        <div className="who">
          <span>Hi, {member.name.split(' ')[0]}</span>
          <button onClick={() => api('/members/logout', { method: 'POST' }).then(() => setMember(null))}>Sign out</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/book" element={<Book />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
