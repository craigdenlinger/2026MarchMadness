import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req, 'ADMIN_SECRET')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { winnerTeamId, loserTeamId, roundNumber, completedAt, isChampionship } = body;
    if (!winnerTeamId || !loserTeamId || !roundNumber) {
      return NextResponse.json({ error: 'winnerTeamId, loserTeamId, and roundNumber are required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: winner, error: winnerError } = await supabase.from('teams').select('id, wins').eq('id', winnerTeamId).single();
    if (winnerError) throw winnerError;

    const { error: winnerUpdateError } = await supabase
      .from('teams')
      .update({ wins: (winner.wins || 0) + 1, is_champion: !!isChampionship, is_alive: true })
      .eq('id', winnerTeamId);
    if (winnerUpdateError) throw winnerUpdateError;

    const { error: loserUpdateError } = await supabase
      .from('teams')
      .update({ is_alive: false })
      .eq('id', loserTeamId);
    if (loserUpdateError) throw loserUpdateError;

    const { error: gameError } = await supabase.from('games').insert({
      winner_team_id: winnerTeamId,
      loser_team_id: loserTeamId,
      round_number: Number(roundNumber),
      completed_at: completedAt || new Date().toISOString(),
      is_championship: !!isChampionship,
      source: 'manual',
    });
    if (gameError) throw gameError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record game result.' }, { status: 500 });
  }
}
