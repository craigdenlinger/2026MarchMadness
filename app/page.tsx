import Link from 'next/link';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { getLeaderboard, getPublicMetadata } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const meta = await getPublicMetadata();

  if (!meta.locked) {
    return (
      <section>
        <h2>Entries are still open</h2>

        <p>
          The leaderboard and team picks will appear automatically after the
          entry deadline passes.
        </p>

        <p>
          Entry lock time: <strong>{meta.lockAt}</strong>
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <Link href="/enter">Enter your picks</Link>
          <Link href="/rules">Read the rules</Link>
        </div>

        <div style={{ marginTop: 32 }}>
          <h3>Scoring</h3>
          <p>Seed × wins</p>

          <h3>Championship bonus</h3>
          <p>Seed × 5</p>

          <h3>Format</h3>
          <p>4 per region + 1 bonus</p>
        </div>
      </section>
    );
  }

  const rows = await getLeaderboard();

  return (
    <section>
      <h2>March Madness 2026</h2>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href="/popularity">See most-picked teams</Link>
      </div>

      <h3>Scoring</h3>
      <p>Seed × wins</p>

      <h3>Championship bonus</h3>
      <p>Seed × 5</p>

      <h3>Format</h3>
      <p>4 per region + 1 bonus</p>

      <h2>How scoring works</h2>
      <p>
        Every win earns points equal to the team&apos;s seed. Example: a 10-seed
        that wins twice is worth 20 points.
      </p>

      <p>
        The championship game is special: if you picked the national champion,
        that final win is worth seed × 5 for that game.
      </p>

      <h2>What you see here</h2>
      <p>Points = points already earned.</p>
      <p>Live Teams = how many of that player&apos;s picks are still alive.</p>
      <p>Max Remaining = the most additional points that player could still earn.</p>
      <p>Projected Max = current points + max remaining.</p>

      <LeaderboardTable initialRows={rows} />
    </section>
  );
}
