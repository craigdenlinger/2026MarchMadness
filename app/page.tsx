import Link from 'next/link';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero-card card">
        <div className="hero-copy">
          <div className="hero-kicker">March Madness 2026 • high-upside seed hunting</div>
          <h2 className="hero-title">Bennett Stirtz energy. Chaos-friendly scoring. Live pool standings.</h2>
          <p className="hero-text">This pool is built for upside, not safe chalk. Hunt the dangerous seeds, sweat the late-night upset runs, and watch the board move as soon as scores update.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/enter" className="btn">Enter your picks</Link>
            <Link href="/popularity" className="btn secondary">See most-picked teams</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="small muted">Scoring</div>
            <div className="stat-value">Seed × wins</div>
          </div>
          <div className="stat-card">
            <div className="small muted">Championship bonus</div>
            <div className="stat-value">Seed × 5</div>
          </div>
          <div className="stat-card">
            <div className="small muted">Format</div>
            <div className="stat-value">4 per region + 1 bonus</div>
          </div>
        </div>
      </section>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>How scoring works</h2>
          <p>Every win earns points equal to the team's seed. Example: a 10-seed that wins twice is worth 20 points.</p>
          <p>The championship game is special: if you picked the national champion, that final win is worth <strong>seed × 5</strong> for that game.</p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>What you see here</h2>
          <p><strong>Points</strong> = points already earned.</p>
          <p><strong>Live Teams</strong> = how many of that player's picks are still alive.</p>
          <p><strong>Max Remaining</strong> = the most additional points that player could still earn.</p>
        </div>
      </div>
      <LeaderboardTable />
    </div>
  );
}
