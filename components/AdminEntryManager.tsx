'use client';

import { useState } from 'react';
import type { AdminEntryRow } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function AdminEntryManager({ entries }: { entries: AdminEntryRow[] }) {
  const [secret, setSecret] = useState('');
  const [items, setItems] = useState(entries);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function removeEntry(entryId: string, participantName: string) {
    if (!secret) {
      setError('Enter your admin secret first.');
      return;
    }

    if (!window.confirm(`Delete ${participantName}'s entry? This cannot be undone.`)) {
      return;
    }

    setWorkingId(entryId);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/delete-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete entry.');
      }

      setItems((current) => current.filter((entry) => entry.entryId !== entryId));
      setMessage(`${participantName}'s entry was removed.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section>
      <h2>Delete test or duplicate entries</h2>
      <p>Enter your admin secret, then remove any test submissions you do not want on the board.</p>

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
        />

        {message ? <p>{message}</p> : null}
        {error ? <p>{error}</p> : null}
      </div>

      {items.length === 0 ? (
        <p>No entries found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Participant</th>
              <th align="left">Paid Via</th>
              <th align="left">Picks</th>
              <th align="left">Submitted</th>
              <th align="left">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr key={entry.entryId}>
                <td>{entry.participantName}</td>
                <td>{entry.paymentMethod || '—'}</td>
                <td>{entry.pickCount}</td>
                <td>{formatDateTime(entry.submittedAt)}</td>
                <td>
                  <button
                    onClick={() => removeEntry(entry.entryId, entry.participantName)}
                    disabled={workingId === entry.entryId}
                  >
                    {workingId === entry.entryId ? 'Removing...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
