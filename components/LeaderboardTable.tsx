'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LeaderboardRow } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function LeaderboardTable() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch('/api/public/leaderboard', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load leaderboard');
      setRows(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="card">Loading leaderboard...</div>;
  if (error) return <div className="card error">{error}</div>;
  if (rows.length === 0) return <div className="card">No entries yet.</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Leaderboard</h2>
          <div className="muted">Auto-refreshes every 60 seconds. Click any participant to see the full card.</div>
        </div>
        <div className="badge">Ties share the same rank</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Points</th>
            <th>Live Teams</th>
            <th>Max Remaining</th>
            <th>Paid Via</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.entryId}>
              <td>{index + 1}</td>
              <td><Link href={`/entry/${row.entryId}`}>{row.participantName}</Link></td>
              <td>{row.points}</td>
              <td>{row.liveTeams}</td>
              <td>{row.maxRemainingPoints}</td>
              <td>{row.paymentMethod || '—'}</td>
              <td>{formatDateTime(row.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
