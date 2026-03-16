'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TeamPickCount } from '@/lib/types';

export function TeamPopularityChart() {
  const [rows, setRows] = useState<TeamPickCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/public/team-popularity', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load team popularity');
        setRows(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load team popularity');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const maxCount = useMemo(() => Math.max(1, ...rows.map((row) => row.pickCount)), [rows]);

  if (loading) return <div className="card">Loading team popularity...</div>;
  if (error) return <div className="card error">{error}</div>;
  if (rows.length === 0) return <div className="card">No entries yet, so there is no pick distribution to chart.</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Most-picked teams</h2>
          <div className="muted">How many players selected each team.</div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div key={row.teamId} className="bar-row">
            <div className="bar-label">{row.seed} {row.teamName} <span className="muted small">({row.region})</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(row.pickCount / maxCount) * 100}%` }} /></div>
            <div className="bar-value">{row.pickCount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
