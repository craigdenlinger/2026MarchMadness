'use client';

import { useState } from 'react';
import { officialTeams2026 } from '@/lib/officialTeams2026';

const template = JSON.stringify(officialTeams2026, null, 2);

export default function ImportTeamsPage() {
  const [secret, setSecret] = useState('');
  const [payload, setPayload] = useState(template);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const teams = JSON.parse(payload);
      const response = await fetch('/api/admin/import-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ teams }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setMessage(`Imported ${data.inserted} teams.`);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Import teams</h2>
      <p className="muted">
        This page is preloaded with the official 2026 men's bracket field from NCAA.com, including the 4 play-in winner slots.
        You can import it as-is. Each row needs <span className="code">name</span>, <span className="code">region</span>, and <span className="code">seed</span>. Optional: <span className="code">espn_team_id</span>.
      </p>
      <label>
        <div style={{ marginBottom: 6 }}>Admin secret</div>
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
      </label>
      <div style={{ marginTop: 12 }}>
        <textarea rows={24} value={payload} onChange={(e) => setPayload(e.target.value)} />
      </div>
      {message ? <div className="success" style={{ marginTop: 12 }}>{message}</div> : null}
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
      <div style={{ marginTop: 16 }}>
        <button className="btn" disabled={loading} onClick={submit}>{loading ? 'Importing...' : 'Import official 2026 bracket teams'}</button>
      </div>
    </div>
  );
}
