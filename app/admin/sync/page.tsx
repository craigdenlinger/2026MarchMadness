'use client';

import { useState } from 'react';

export default function SyncPage() {
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function runSync() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/sync-scores', {
        method: 'GET',
        headers: { 'x-admin-secret': secret },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sync failed');
      setMessage(`Sync finished. Inserted ${data.insertedGames} games and updated ${data.updatedTeams} teams.`);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Run automatic score sync</h2>
      <p className="muted">This uses ESPN's public scoreboard endpoint as a practical data source. Because it is not an official supported developer API, the matching logic is built to be editable if ESPN changes its response format.</p>
      <label>
        <div style={{ marginBottom: 6 }}>Sync secret or admin secret</div>
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
      </label>
      {message ? <div className="success" style={{ marginTop: 12 }}>{message}</div> : null}
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
      <div style={{ marginTop: 16 }}>
        <button className="btn" disabled={loading} onClick={runSync}>{loading ? 'Running...' : 'Run sync now'}</button>
      </div>
    </div>
  );
}
