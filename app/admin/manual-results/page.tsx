'use client';

import { useEffect, useState } from 'react';
import type { PublicMetadata } from '@/lib/types';

export default function ManualResultsPage() {
  const [meta, setMeta] = useState<PublicMetadata | null>(null);
  const [secret, setSecret] = useState('');
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [loserTeamId, setLoserTeamId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [isChampionship, setIsChampionship] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/metadata').then((r) => r.json()).then(setMeta).catch(() => setError('Failed to load teams.'));
  }, []);

  const allTeams = meta ? Object.values(meta.regions).flat() : [];

  async function submit() {
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/record-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ winnerTeamId, loserTeamId, roundNumber, isChampionship }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setMessage('Result recorded. Leaderboard will reflect it on next refresh.');
    } catch (err: any) {
      setError(err.message || 'Failed');
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Enter result manually</h2>
      <div className="grid grid-2">
        <label>
          <div style={{ marginBottom: 6 }}>Admin secret</div>
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Round number</div>
          <input value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <label>
          <div style={{ marginBottom: 6 }}>Winner</div>
          <select value={winnerTeamId} onChange={(e) => setWinnerTeamId(e.target.value)}>
            <option value="">Select winner</option>
            {allTeams.map((team) => <option key={team.id} value={team.id}>{team.seed} — {team.name}</option>)}
          </select>
        </label>
        <label>
          <div style={{ marginBottom: 6 }}>Loser</div>
          <select value={loserTeamId} onChange={(e) => setLoserTeamId(e.target.value)}>
            <option value="">Select loser</option>
            {allTeams.map((team) => <option key={team.id} value={team.id}>{team.seed} — {team.name}</option>)}
          </select>
        </label>
      </div>
      <label className="team-option" style={{ marginTop: 12 }}>
        <input type="checkbox" checked={isChampionship} onChange={(e) => setIsChampionship(e.target.checked)} style={{ width: 18 }} />
        <span>This was the championship game</span>
      </label>
      {message ? <div className="success" style={{ marginTop: 12 }}>{message}</div> : null}
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={submit}>Record result</button>
      </div>
    </div>
  );
}
