import React, { useEffect, useState } from 'react';
import { api } from '../App.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Schedule() {
  const [slots, setSlots] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [error, setError] = useState('');

  const load = () => Promise.all([
    fetch('/api/schedule').then(r => r.json()),
    fetch('/api/coaches').then(r => r.json()),
  ]).then(([s, c]) => { setSlots(s.slots); setCoaches(c.coaches); });

  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const reassign = async (slotId, coachId) => {
    try {
      await api(`/admin/schedule/${slotId}`, {
        method: 'PATCH',
        body: JSON.stringify({ coach_id: coachId === '' ? null : Number(coachId) }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Schedule</h2>
      <p className="muted">Reassign a coach inline. Changes go live immediately on the site.</p>
      <table className="schedule-table">
        <thead>
          <tr><th>Day</th><th>Time</th><th>Class</th><th>Coach</th></tr>
        </thead>
        <tbody>
          {slots.map(s => (
            <tr key={s.id}>
              <td>{DAYS[s.day_of_week]}</td>
              <td>{s.start_time}–{s.end_time}</td>
              <td>{s.class_name}</td>
              <td>
                <select value={s.coach_id ?? ''} onChange={e => reassign(s.id, e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
