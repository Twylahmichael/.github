import React, { useEffect, useState } from 'react';
import { api, DAYS, fmtDate, fmtTime, nextDateOn } from '../api.js';

export function Book() {
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(({ slots }) => setSlots(slots)).catch(e => setError(e.message));
  }, []);

  const book = async (slot, sessionDate) => {
    const key = `${slot.id}:${sessionDate}`;
    setBusyKey(key);
    setError('');
    setFlash('');
    try {
      await api('/members/me/bookings', {
        method: 'POST',
        body: JSON.stringify({ slot_id: slot.id, session_date: sessionDate }),
      });
      setFlash(`Booked ${slot.class_name} on ${fmtDate(sessionDate)}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyKey(null);
    }
  };

  if (error && !slots) return <div className="error">{error}</div>;
  if (!slots) return <div className="loading">Loading…</div>;

  // Group by day-of-week for a timetable-board layout.
  const byDay = Array.from({ length: 7 }, () => []);
  for (const s of slots) byDay[s.day_of_week].push(s);

  return (
    <div className="book">
      <h2>Book a class</h2>
      <p className="muted">Booking books the next occurrence of that class. You can cancel from your calendar up until the class starts.</p>
      {flash && <div className="flash">{flash}</div>}
      {error && <div className="error">{error}</div>}

      <div className="board">
        {byDay.map((daySlots, dow) => daySlots.length > 0 && (
          <section key={dow} className="day-column">
            <header>{DAYS[dow]}</header>
            {daySlots.map(s => {
              const sessionDate = nextDateOn(dow);
              const key = `${s.id}:${sessionDate}`;
              return (
                <div key={s.id} className="slot">
                  <div className="time">{fmtTime(s.start_time)}</div>
                  <div className="name">{s.class_name}</div>
                  <div className="coach">{s.coach_name || 'Coach TBA'}</div>
                  <div className="on">{fmtDate(sessionDate)}</div>
                  <button className="primary small" disabled={busyKey === key} onClick={() => book(s, sessionDate)}>
                    {busyKey === key ? '…' : 'Book'}
                  </button>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
