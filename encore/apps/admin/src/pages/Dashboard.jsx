import React, { useEffect, useState } from 'react';
import { api } from '../App.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/dashboard').then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading…</div>;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="tiles">
        <div className="tile"><div className="num">{data.bookingsToday}</div><div className="label">Bookings today</div></div>
        <div className="tile"><div className="num">{data.bookingsThisWeek}</div><div className="label">Bookings this week</div></div>
        <div className="tile alert">
          <div className="num">{data.unassignedSlots.length}</div>
          <div className="label">Classes without a coach</div>
        </div>
      </div>
      {data.unassignedSlots.length > 0 && (
        <div className="panel">
          <h3>Needs a coach</h3>
          <ul>
            {data.unassignedSlots.map(s => (
              <li key={s.id}>{DAYS[s.day_of_week]} {s.start_time} — {s.class_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
