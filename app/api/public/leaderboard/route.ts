import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await getLeaderboard();
    return NextResponse.json({ rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to load leaderboard.' },
      { status: 500 }
    );
  }
}
