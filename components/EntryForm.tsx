'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PaymentMethod, PublicMetadata, Region } from '@/lib/types';

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

export function EntryForm() {
  const [meta, setMeta] = useState<PublicMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmedFinal, setConfirmedFinal] = useState(false);

  const [regionalPicks, setRegionalPicks] = useState<Record<Region, string[]>>({
    East: [],
    West: [],
    South: [],
    Midwest: [],
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

  const allPickedIds = useMemo(
    () =>
      new Set(
        [...REGIONS.flatMap((region) => regionalPicks[region]), bonusPickTeamId].filter(Boolean)
      ),
    [regionalPicks, bonusPickTeamId]
  );

  const totalSelected =
    REGIONS.reduce((sum, region) => sum + regionalPicks[region].length, 0) +
    (bonusPickTeamId ? 1 : 0);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function toggleRegionalPick(region: Region, teamId: string) {
    setRegionalPicks((current) => {
      const regionPicks = current[region];
      const selected = regionPicks.includes(teamId);

      if (selected) {
        return {
          ...current,
          [region]: regionPicks.filter((id) => id !== teamId),
        };
      }

      if (regionPicks.length >= 4) return current;
      if (allPickedIds.has(teamId)) return current;

      return {
        ...current,
        [region]: [...regionPicks, teamId],
      };
    });
  }

  function chooseBonus(teamId: string) {
    if (!teamId) {
      setBonusPickTeamId('');
      return;
    }

    if (allPickedIds.has(teamId)) return;
    setBonusPickTeamId(teamId);
  }

  const isValid =
    !!displayName.trim() &&
    emailIsValid &&
    !!paymentMethod &&
    REGIONS.every((region) => regionalPicks[region].length === 4) &&
    !!bonusPickTeamId &&
    confirmedFinal;

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
        body: JSON.stringify({
          displayName,
          email,
          paymentMethod,
          regionalPicks,
          bonusPickTeamId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit entry.');

      setSuccessMessage(
        'Your entry is locked in. Nice work. Screenshot your confirmation page if you want a receipt.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading entry form...</p>;
  if (error && !meta) return <p>{error}</p>;
  if (!meta) return null;

  if (meta.locked) {
    return (
      <section>
        <h2>Entries are locked.</h2>
        <p>The deadline has passed for this tournament.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Submit your picks</h2>
      <p>
        Pick 4 teams per region, plus 1 bonus pick from any region. All 17 picks must
        be different teams. Once you submit, the entry is final.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        <label>
          <div style={{ marginBottom: 6 }}>Your name</div>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="John Smith"
          />
        </label>

        <label>
          <div style={{ marginBottom: 6 }}>Email address</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />
        </label>

        <div>
          <div style={{ marginBottom: 6 }}>Payment method</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <input
              type="radio"
              checked={paymentMethod === 'Venmo'}
              onChange={() => setPaymentMethod('Venmo')}
              style={{ width: 18 }}
            />
            Venmo
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              checked={paymentMethod === 'Paypal'}
              onChange={() => setPaymentMethod('Paypal')}
              style={{ width: 18 }}
            />
            Paypal
          </label>

          <p style={{ marginTop: 8 }}>
            $100 entry fee, one entry per person, payouts are $300 to 2nd place, rest to
            1st, Venmo: craig-denlinger or Paypal: craig.denlinger@gmail.com
          </p>
        </div>

        {REGIONS.map((region) => (
          <section key={region}>
            <h3>
              {region} <span style={{ opacity: 0.7 }}>{regionalPicks[region].length}/4</span>
            </h3>

            <div style={{ display: 'grid', gap: 8 }}>
              {meta.regions[region].map((team) => {
                const checked = regionalPicks[region].includes(team.id);
                const disabled =
                  !checked &&
                  (regionalPicks[region].length >= 4 || allPickedIds.has(team.id));

                return (
                  <label
                    key={team.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleRegionalPick(region, team.id)}
                      style={{ width: 18 }}
                    />
                    {team.seed} — {team.name}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          <h3>Bonus pick {bonusPickTeamId ? '1/1' : '0/1'}</h3>

          <select value={bonusPickTeamId} onChange={(e) => chooseBonus(e.target.value)}>
            <option value="">Select your bonus team</option>
            {REGIONS.flatMap((region) => meta.regions[region]).map((team) => (
              <option key={team.id} value={team.id}>
                {team.seed} — {team.name} ({team.region})
              </option>
            ))}
          </select>

          <p>Bonus pick must be a different team from your 16 regional picks.</p>
        </section>

        <section>
          <h3>Review</h3>

          {REGIONS.map((region) => (
            <div key={region} style={{ marginBottom: 12 }}>
              <strong>{region}</strong>
              <ul>
                {regionalPicks[region].map((id) => {
                  const team = meta.regions[region].find((t) => t.id === id);
                  return (
                    <li key={id}>
                      {team?.seed} — {team?.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <strong>Bonus</strong>
            <ul>
              {bonusPickTeamId ? (
                (() => {
                  const team = REGIONS.flatMap((region) => meta.regions[region]).find(
                    (t) => t.id === bonusPickTeamId
                  );
                  return (
                    <li>
                      {team?.seed} — {team?.name}
                    </li>
                  );
                })()
              ) : (
                <li>Not selected yet</li>
              )}
            </ul>
          </div>

          <p>Selected so far: {totalSelected}/17</p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={confirmedFinal}
              onChange={(e) => setConfirmedFinal(e.target.checked)}
              style={{ width: 18 }}
            />
            I understand that once I submit this form, my entry is final and cannot be edited.
          </label>

          {error ? <p>{error}</p> : null}
          {successMessage ? <p>{successMessage}</p> : null}
        </section>

        <button type="submit" disabled={!isValid || submitting}>
          {submitting ? 'Submitting...' : 'Submit final entry'}
        </button>
      </form>
    </section>
  );
}
