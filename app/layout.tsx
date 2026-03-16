import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'NCAA Tournament Pool',
  description: 'Live March Madness pool scoring and leaderboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'NCAA Tournament Pool';

  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div>
              <h1 style={{ margin: 0 }}>{appName}</h1>
              <div className="muted">Live standings, locked entries, automatic scoring</div>
            </div>
            <nav className="nav">
              <Link href="/">Leaderboard</Link>
              <Link href="/popularity">Team Picks</Link>
              <Link href="/enter">Enter Picks</Link>
              <Link href="/rules">Rules</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
