import React from 'react';

export function Placeholder({ name, note }) {
  return (
    <div>
      <h2>{name}</h2>
      <p className="muted">{note || `${name} manager — routes and admin API endpoints defined in ARCHITECTURE.md; UI stub for the scaffold.`}</p>
    </div>
  );
}
