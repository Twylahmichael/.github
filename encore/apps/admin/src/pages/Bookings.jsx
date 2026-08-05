import React, { useEffect, useState } from 'react';
import { api } from '../App.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

export function Bookings() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(plusDays(7));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/admin/bookings?from=${from}&to=${to}`).then(setData).catch(e => setError(e.message));
  }, [from, to]);

  const grouped = data?.bookings?.reduce((acc, b) => {
    (acc[b.session_date] ||= []).push(b);
    return acc;
  }, {});

  return (
    <div>
      <h2>Bookings</h2>
      <div className="filters">
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      </div>
      {error && <div className="error">{error}</div>}
      {data && Object.keys(grouped).length === 0 && <p className="muted">No bookings in this range.</p>}
      {grouped && Object.entries(grouped).map(([date, rows]) => (
        <div key={date} className="panel">
          <h3>{DAYS[new Date(date).getDay()]} · {date} <span className="muted">({rows.length})</span></h3>
          <table className="schedule-table">
            <thead>
              <tr><th>Time</th><th>Class</th><th>Member</th><th>Phone</th><th>Source</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id} className={b.status === 'cancelled' ? 'row-cancelled' : ''}>
                  <td>{b.start_time}</td>
                  <td>{b.class_name}</td>
                  <td>{b.member_name}{b.member_id ? '' : ' *'}</td>
                  <td>{b.member_phone}</td>
                  <td>{b.source}</td>
                  <td>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data && <p className="muted">* = walk-in / manually logged, not a portal member.</p>}
    </div>
  );
}
