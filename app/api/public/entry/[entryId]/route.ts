import { NextRequest, NextResponse } from 'next/server';
import { getEntryDetail } from '@/lib/data';

export async function GET(_req: NextRequest, context: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await context.params;
    const entry = await getEntryDetail(entryId);
    if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load entry.' }, { status: 500 });
  }
}
