import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTournament } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { normalizeTeamName } from '@/lib/utils';

type TeamRow = {
  name: string;
  region: 'East' | 'West' | 'South' | 'Midwest';
  seed: number;
  espn_team_id?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req, 'ADMIN_SECRET')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const teams = body.teams as TeamRow[];
    if (!Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({ error: 'No teams supplied.' }, { status: 400 });
    }

    const tournament = await getCurrentTournament();
    const supabase = getSupabaseAdmin();

    await supabase.from('teams').delete().eq('tournament_id', tournament.id);

    const rows = teams.map((team) => ({
      tournament_id: tournament.id,
      name: team.name.trim(),
      normalized_name: normalizeTeamName(team.name),
      region: team.region,
      seed: Number(team.seed),
      is_alive: true,
      wins: 0,
      is_champion: false,
      espn_team_id: team.espn_team_id || null,
    }));

    const { error } = await supabase.from('teams').insert(rows);
    if (error) throw error;

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to import teams.' }, { status: 500 });
  }
}
