import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/data';

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

    const supabase = getSupabaseAdmin();
    const tournamentYear = Number(process.env.TOURNAMENT_YEAR || 2026);

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('year', tournamentYear)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found.' },
        { status: 500 }
      );
    }

    const tournamentId = (tournament as { id: string }).id;

    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) {
      throw deleteError;
    }

    const rows = teams.map((team: any) => ({
      tournament_id: tournamentId,
      name: team.name,
      region: team.region,
      seed: team.seed,
      wins: team.wins ?? 0,
      is_alive: team.is_alive ?? true,
      is_champion: team.is_champion ?? false,
    }));

    const { error: insertError } = await (supabase as any).from('teams').insert(rows);

    if (insertError) {
      throw insertError;
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
