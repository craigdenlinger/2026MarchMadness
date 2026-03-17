'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LeaderboardRow } from '@/lib/types';

function formatLastUpdated(date: Date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LeaderboardTable({
  initialRows,
}: {
  initialRows: LeaderboardRow[];
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;

    async function refreshLeaderboard() {
      try {
        setLoading(true);

        const response = await fetch('/api/public/leaderboard', {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to refresh leaderboard.');
        }

        if (!cancelled) {
          setRows(data.rows || []);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const interval = setInterval(refreshLeaderboard, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!rows.length) {
    return (
      <section>
        <p>No leaderboard entries yet.</p>
      </section>
    );
  }

  return (
    <section>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>
        <p style={{ margin: 0 }}>
          {loading ? 'Updating leaderboard…' : `Last updated: ${formatLastUpdated(lastUpdated)}`}
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Rank</th>
            <th align="left">Participant</th>
            <th align="left">Points</th>
            <th align="left">Live Teams</th>
            <th align="left">Max Remaining</th>
            <th align="left">Projected Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const projectedMax = row.points + row.maxRemainingPoints;
            const hasLiveTeams = row.liveTeams > 0;

            return (
              <tr
                key={row.entryId}
                style={{
                  background: hasLiveTeams ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <td>{index + 1}</td>
                <td>
                  <Link href={`/entry/${row.entryId}`}>{row.participantName}</Link>
                </td>
                <td>{row.points}</td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      minWidth: 32,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontWeight: 700,
                      background: hasLiveTeams
                        ? 'rgba(34, 197, 94, 0.18)'
                        : 'rgba(239, 68, 68, 0.18)',
                    }}
                  >
                    {row.liveTeams}
                  </span>
                </td>
                <td>{row.maxRemainingPoints}</td>
                <td style={{ fontWeight: 700 }}>{projectedMax}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
