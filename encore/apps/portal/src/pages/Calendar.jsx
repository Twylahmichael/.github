import React, { useEffect, useState } from 'react';
import { api, DAYS, fmtDate, fmtTime } from '../api.js';

export function Calendar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api('/members/me/bookings').then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this class?')) return;
    setBusyId(id);
    try { await api(`/members/me/bookings/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  };

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading…</div>;

  return (
    <div className="calendar">
      <h2>Upcoming</h2>
      {data.upcoming.length === 0 && (
        <div className="empty">
          <p>No upcoming bookings.</p>
          <a className="primary" href="/book">Book a class →</a>
        </div>
      )}
      <div className="cards">
        {data.upcoming.map(b => (
          <article key={b.id} className="booking-card">
            <div className="date">{fmtDate(b.session_date)}</div>
            <div className="class">{b.class_name}</div>
            <div className="time">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</div>
            <div className="coach">{b.coach_name || 'Coach TBA'}</div>
            <button className="ghost" disabled={busyId === b.id} onClick={() => cancel(b.id)}>
              {busyId === b.id ? '…' : 'Cancel'}
            </button>
          </article>
        ))}
      </div>

      {data.past.length > 0 && (
        <>
          <h2>Recent history</h2>
          <ul className="history">
            {data.past.map(b => (
              <li key={b.id} className={b.status}>
                <span>{fmtDate(b.session_date)}</span>
                <span>{b.class_name}</span>
                <span>{fmtTime(b.start_time)}</span>
                <span className="status">{b.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
