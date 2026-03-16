import Link from 'next/link';
import { getEntryDetail } from '@/lib/data';

export default async function EntryDetailPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const entry = await getEntryDetail(entryId);

  if (!entry) {
    return <div className="card">Entry not found.</div>;
  }

  return (
    <div className="grid">
      <div className="card basketball-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="muted small">Participant card</div>
            <h2 style={{ margin: '4px 0 6px' }}>{entry.participantName}</h2>
            <div className="muted">Paid via {entry.paymentMethod || 'not recorded'}.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="badge">Points: {entry.points}</span>
            <span className="badge">Live teams: {entry.liveTeams}</span>
            <span className="badge">Max remaining: {entry.maxRemainingPoints}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>All selections</h3>
          <Link href="/">← Back to leaderboard</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Team</th>
              <th>Region</th>
              <th>Seed</th>
              <th>Wins</th>
              <th>Points</th>
              <th>Still alive?</th>
              <th>Max remaining</th>
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
      </div>
    </div>
  );
}
