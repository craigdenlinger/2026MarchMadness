import Link from 'next/link';
import { getEntryDetail } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AdminEntryDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const entry = await getEntryDetail(entryId);

  if (!entry) {
    return (
      <section>
        <p>Entry not found.</p>
        <p>
          <Link href="/admin/entries">← Back to Manage Entries</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <p>
        <Link href="/admin/entries">← Back to Manage Entries</Link>
      </p>

      <div style={{ marginBottom: 24 }}>
        <h2>{entry.participantName}</h2>
        <p>Email: {entry.participantEmail || '—'}</p>
        <p>Paid via: {entry.paymentMethod || 'not recorded'}</p>
        <p>
          Points: {entry.points} | Live teams: {entry.liveTeams} | Max remaining:{' '}
          {entry.maxRemainingPoints}
        </p>
      </div>

      <h3>All selections</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Type</th>
            <th align="left">Team</th>
            <th align="left">Region</th>
            <th align="left">Seed</th>
            <th align="left">Wins</th>
            <th align="left">Points</th>
            <th align="left">Still alive?</th>
            <th align="left">Max remaining</th>
          </tr>
        </thead>
        <tbody>
          {entry.picks.map((pick) => (
            <tr key={`${pick.pickType}-${pick.teamId}`}>
              <td>{pick.pickType === 'bonus' ? 'Bonus' : 'Regional'}</td>
              <td>{pick.teamName}</td>
              <td>{pick.region}</td>
              <td>{pick.seed}</td>
              <td>{pick.wins}</td>
              <td>{pick.points}</td>
              <td>{pick.isChampion ? 'Champion' : pick.isAlive ? 'Yes' : 'No'}</td>
              <td>{pick.maxRemainingPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
