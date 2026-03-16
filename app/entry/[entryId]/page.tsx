import Link from 'next/link';
import { getEntryDetail, getPublicMetadata } from '@/lib/data';

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const meta = await getPublicMetadata();

  if (!meta.locked) {
    return (
      <section>
        <h2>Participant selections are hidden until entries lock</h2>
        <p>
          Individual entry pages will become available automatically after the
          deadline passes.
        </p>
        <p>
          Entry lock time: <strong>{meta.lockAt}</strong>
        </p>
        <Link href="/enter">Back to Enter Picks</Link>
      </section>
    );
  }

  const { entryId } = await params;
  const entry = await getEntryDetail(entryId);

  if (!entry) {
    return (
      <section>
        <p>Entry not found.</p>
      </section>
    );
  }

  return (
    <section>
      <div style={{ marginBottom: 24 }}>
        <p>Participant card</p>
        <h2>{entry.participantName}</h2>
        <p>Paid via {entry.paymentMethod || 'not recorded'}.</p>
        <p>
          Points: {entry.points} | Live teams: {entry.liveTeams} | Max remaining:{' '}
          {entry.maxRemainingPoints}
        </p>
      </div>

      <h3>All selections</h3>
      <p>
        <Link href="/">← Back to leaderboard</Link>
      </p>

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
