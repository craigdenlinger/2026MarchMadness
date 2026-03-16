import { NextResponse } from 'next/server';
import { getTeamPopularity } from '@/lib/data';

export async function GET() {
  try {
    return NextResponse.json(await getTeamPopularity());
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load team popularity.' }, { status: 500 });
  }
}
