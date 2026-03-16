import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTournament, getSupabaseAdmin } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teams = body.teams;

    if (!Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { error: 'A non-empty teams array is required.' },
        { status: 400 }
      );
    }

    const tournament = await getCurrentTournament();
    const supabase = getSupabaseAdmin();

    const tournamentId = tournament.id as string;

    await supabase.from('teams').delete().eq('tournament_id', tournamentId);

    const rows = teams.map((team: any) => ({
      tournament_id: tournamentId,
      name: team.name,
      region: team.region,
      seed: team.seed,
      wins: team.wins ?? 0,
      is_alive: team.is_alive ?? true,
      is_champion: team.is_champion ?? false,
    }));

    const { error } = await supabase.from('teams').insert(rows);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Failed to import teams.' },
      { status: 500 }
    );
  }
}
