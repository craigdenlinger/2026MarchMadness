import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req, 'ADMIN_SECRET')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const entryId = body.entryId as string | undefined;
    if (!entryId) return NextResponse.json({ error: 'Entry ID is required.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('id, participant_id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    }

    const { error: deleteEntryError } = await supabase.from('entries').delete().eq('id', entryId);
    if (deleteEntryError) throw deleteEntryError;

    const { data: remainingEntries } = await supabase
      .from('entries')
      .select('id')
      .eq('participant_id', entry.participant_id)
      .limit(1);

    if (!remainingEntries || remainingEntries.length === 0) {
      await supabase.from('participants').delete().eq('id', entry.participant_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete entry.' }, { status: 500 });
  }
}
