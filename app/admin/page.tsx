import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="grid grid-2">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin tools</h2>
        <p className="muted">Use these tools to import teams, remove test entries, record games manually, and run score syncs.</p>
        <div className="grid">
          <Link href="/admin/import-teams" className="btn secondary">Import teams</Link>
          <Link href="/admin/entries" className="btn secondary">Manage entries</Link>
          <Link href="/admin/manual-results" className="btn secondary">Manual results</Link>
          <Link href="/admin/sync" className="btn secondary">Sync scores</Link>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Before games tip</h3>
        <ul>
          <li>Import teams once.</li>
          <li>Confirm the lock time in Supabase.</li>
          <li>Delete test entries before you share the link.</li>
          <li>Enable cron only after the production site is live.</li>
        </ul>
      </div>
    </div>
  );
}
