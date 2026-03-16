import { NextResponse } from 'next/server';
import { getPublicMetadata } from '@/lib/data';

export async function GET() {
  try {
    const metadata = await getPublicMetadata();
    return NextResponse.json(metadata);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load metadata' }, { status: 500 });
  }
}
