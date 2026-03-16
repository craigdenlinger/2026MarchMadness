'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PaymentMethod, PublicMetadata, Region } from '@/lib/types';

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

export function EntryForm() {
  const [meta, setMeta] = useState<PublicMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmedFinal, setConfirmedFinal] = useState(false);
  const [regionalPicks, setRegionalPicks] = useState<Record<Region, string[]>>({
    East: [], West: [], South: [], Midwest: [],
  });
  const [bonusPickTeamId, setBonusPickTeamId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/public/metadata', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load form.');
        setMeta(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load form.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allPickedIds = useMemo(() => new Set([...REGIONS.flatMap((region) => regionalPicks[region]), bonusPickTeamId].filter(Boolean)), [regionalPicks, bonusPickTeamId]);
  const totalSelected = REGIONS.reduce((sum, region) => sum + regionalPicks[region].length, 0) + (bonusPickTeamId ? 1 : 0);

  function toggleRegionalPick(region: Region, teamId: string) {
    setRegionalPicks((current) => {
      const regionPicks = current[region];
      const selected = regionPicks.includes(teamId);
      if (selected) {
        return { ...current, [region]: regionPicks.filter((id) => id !== teamId) };
      }
      if (regionPicks.length >= 4) return current;
      if (allPickedIds.has(teamId)) return current;
      return { ...current, [region]: [...regionPicks, teamId] };
    });
  }

  function chooseBonus(teamId: string) {
    if (!teamId) return setBonusPickTeamId('');
    if (allPickedIds.has(teamId)) return;
    setBonusPickTeamId(teamId);
  }

  const isValid = !!displayName.trim() && !!paymentMethod && REGIONS.every((region) => regionalPicks[region].length === 4) && !!bonusPickTeamId && confirmedFinal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, paymentMethod, regionalPicks, bonusPickTeamId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit entry.');
      setSuccessMessage('Your entry is locked in. Nice work. Screenshot your confirmation page if you want a receipt.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card">Loading entry form...</div>;
  if (error && !meta) return <div className="card error">{error}</div>;
  if (!meta) return null;

  if (meta.locked) {
    return <div className="card"><strong>Entries are locked.</strong><div className="muted">The deadline has passed for this tournament.</div></div>;
  }

  return (
    <form className="grid" onSubmit={handleSubmit}>
      <div className="card basketball-card">
        <h2 style={{ marginTop: 0 }}>Submit your picks</h2>
        <p className="muted">Pick 4 teams per region, plus 1 bonus pick from any region. All 17 picks must be different teams. Once you submit, the entry is final.</p>
        <div className="grid grid-2">
          <label>
            <div style={{ marginBottom: 6 }}>Your name</div>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Smith" />
          </label>
          <div>
            <div style={{ marginBottom: 6 }}>Payment method</div>
            <div className="payment-box">
              <label className="team-option"><input type="radio" name="payment" checked={paymentMethod === 'Venmo'} onChange={() => setPaymentMethod('Venmo')} style={{ width: 18 }} /><span>Venmo</span></label>
              <label className="team-option"><input type="radio" name="payment" checked={paymentMethod === 'Paypal'} onChange={() => setPaymentMethod('Paypal')} style={{ width: 18 }} /><span>Paypal</span></label>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>$100 entry fee, one entry per person, payouts are $300 to 2nd place, rest to 1st, Venmo: craig-denlinger or Paypal: craig.denlinger@gmail.com</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {REGIONS.map((region) => (
          <div className="card" key={region}>
            <div className="region-title">
              <h3 style={{ margin: 0 }}>{region}</h3>
              <span className="badge">{regionalPicks[region].length}/4</span>
            </div>
            {meta.regions[region].map((team) => {
              const checked = regionalPicks[region].includes(team.id);
              const disabled = !checked && (regionalPicks[region].length >= 4 || allPickedIds.has(team.id));
              return (
                <label className="team-option" key={team.id}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleRegionalPick(region, team.id)} style={{ width: 18 }} />
                  <span>{team.seed} — {team.name}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="region-title">
          <h3 style={{ margin: 0 }}>Bonus pick</h3>
          <span className="badge">{bonusPickTeamId ? '1/1' : '0/1'}</span>
        </div>
        <select value={bonusPickTeamId} onChange={(e) => chooseBonus(e.target.value)}>
          <option value="">Select your bonus team</option>
          {REGIONS.flatMap((region) => meta.regions[region]).map((team) => (
            <option key={team.id} value={team.id} disabled={allPickedIds.has(team.id)}>
              {team.seed} — {team.name} ({team.region})
            </option>
          ))}
        </select>
        <div className="muted small" style={{ marginTop: 8 }}>Bonus pick must be a different team from your 16 regional picks.</div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Review</h3>
        <div className="grid grid-4">
          {REGIONS.map((region) => (
            <div key={region}>
              <strong>{region}</strong>
              <ul>
                {regionalPicks[region].map((id) => {
                  const team = meta.regions[region].find((t) => t.id === id);
                  return <li key={id}>{team?.seed} — {team?.name}</li>;
                })}
              </ul>
            </div>
          ))}
          <div>
            <strong>Bonus</strong>
            <ul>
              {bonusPickTeamId ? (() => {
                const team = REGIONS.flatMap((region) => meta.regions[region]).find((t) => t.id === bonusPickTeamId);
                return <li>{team?.seed} — {team?.name}</li>;
              })() : <li>Not selected yet</li>}
            </ul>
          </div>
        </div>
        <div className="notice small" style={{ margin: '12px 0' }}>Selected so far: {totalSelected}/17</div>
        <label className="team-option">
          <input type="checkbox" checked={confirmedFinal} onChange={(e) => setConfirmedFinal(e.target.checked)} style={{ width: 18 }} />
          <span>I understand that once I submit this form, my entry is final and cannot be edited.</span>
        </label>
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        {successMessage ? <div className="success" style={{ marginTop: 12 }}>{successMessage}</div> : null}
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={!isValid || submitting}>{submitting ? 'Submitting...' : 'Submit final entry'}</button>
        </div>
      </div>
    </form>
  );
}
