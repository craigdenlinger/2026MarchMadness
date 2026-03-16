import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/data';

export async function GET() {
  try {
    const rows = await getLeaderboard();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load leaderboard' }, { status: 500 });
  }
}
