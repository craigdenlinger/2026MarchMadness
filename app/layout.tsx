import './globals.css';
import Link from 'next/link';
import { getPublicMetadata } from '@/lib/data';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'NCAA Tournament Pool',
  description: 'Live March Madness pool scoring and leaderboard',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'NCAA Tournament Pool';

  let locked = false;

  try {
    const meta = await getPublicMetadata();
    locked = meta.locked;
  } catch {
    locked = false;
  }

  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ marginBottom: 8 }}>{appName}</h1>
            <p style={{ marginTop: 0, opacity: 0.8 }}>
              Live standings, locked entries, automatic scoring
            </p>

            <nav
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginTop: 16,
              }}
            >
              {locked ? <Link href="/">Leaderboard</Link> : null}
              {locked ? <Link href="/popularity">Team Picks</Link> : null}
              <Link href="/enter">Enter Picks</Link>
              <Link href="/rules">Rules</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
