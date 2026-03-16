import { getSupabaseAdmin } from './supabase';
import { pointsForTeam, remainingPossiblePoints } from './scoring';
import type { AdminEntryRow, EntryDetail, EntryPickDetail, LeaderboardRow, PublicMetadata, Region, Team, TeamPickCount } from './types';

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

export async function getCurrentTournament() {
  const supabase = getSupabaseAdmin();
  const year = Number(process.env.TOURNAMENT_YEAR || new Date().getFullYear());
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('year', year)
    .single();

  if (error || !data) throw new Error(error?.message || `Tournament ${year} not found`);
  return data;
}

export async function getTeamsForTournament(tournamentId: string): Promise<Team[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, region, seed, is_alive, wins, is_champion, espn_team_id')
    .eq('tournament_id', tournamentId)
    .order('region')
    .order('seed');

  if (error) throw new Error(error.message);
  return (data || []) as Team[];
}

export async function getPublicMetadata(): Promise<PublicMetadata> {
  const tournament = await getCurrentTournament();
  const teams = await getTeamsForTournament(tournament.id);
  const grouped = REGIONS.reduce((acc, region) => {
    acc[region] = teams.filter((team) => team.region === region);
    return acc;
  }, {} as Record<Region, Team[]>);

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    year: tournament.year,
    lockAt: tournament.lock_at,
    locked: new Date(tournament.lock_at).getTime() <= Date.now(),
    regions: grouped,
  };
}

function summarizeEntry(entry: any): Omit<EntryDetail, 'picks'> {
  const picks = entry.entry_picks || [];
  const points = picks.reduce((sum: number, pick: any) => {
    const team = pick.teams;
    return sum + pointsForTeam(team.seed, team.wins, team.is_champion);
  }, 0);

  const liveTeams = picks.filter((pick: any) => pick.teams.is_alive).length;
  const maxRemainingPoints = picks.reduce((sum: number, pick: any) => {
    const team = pick.teams;
    return sum + remainingPossiblePoints(team.seed, team.wins, team.is_alive, team.is_champion);
  }, 0);

  return {
    entryId: entry.id,
    participantName: entry.participants.display_name,
    paymentMethod: entry.payment_method,
    submittedAt: entry.submitted_at,
    points,
    liveTeams,
    maxRemainingPoints,
  };
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      id,
      submitted_at,
      payment_method,
      participants!inner(display_name),
      entry_picks(
        pick_type,
        teams!inner(id, name, seed, wins, is_alive, is_champion)
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('submitted_at', { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (entries || []).map((entry: any) => summarizeEntry(entry));

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.maxRemainingPoints !== a.maxRemainingPoints) return b.maxRemainingPoints - a.maxRemainingPoints;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  let currentRank = 0;
  let previousKey = '';
  return rows.map((row, index) => {
    const key = `${row.points}-${row.maxRemainingPoints}`;
    if (key !== previousKey) currentRank = index + 1;
    previousKey = key;
    return { ...row, rank: currentRank };
  });
}

export async function getEntryDetail(entryId: string): Promise<EntryDetail | null> {
  const supabase = getSupabaseAdmin();
  const { data: entry, error } = await supabase
    .from('entries')
    .select(`
      id,
      submitted_at,
      payment_method,
      participants!inner(display_name),
      entry_picks(
        pick_type,
        region,
        teams!inner(id, name, seed, wins, is_alive, is_champion)
      )
    `)
    .eq('id', entryId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!entry) return null;

  const summary = summarizeEntry(entry);
  const picks = ((entry.entry_picks || []) as any[]).map((pick): EntryPickDetail => {
    const team = pick.teams;
    return {
      teamId: team.id,
      teamName: team.name,
      region: pick.region,
      seed: team.seed,
      wins: team.wins,
      isAlive: team.is_alive,
      isChampion: team.is_champion,
      pickType: pick.pick_type,
      points: pointsForTeam(team.seed, team.wins, team.is_champion),
      maxRemainingPoints: remainingPossiblePoints(team.seed, team.wins, team.is_alive, team.is_champion),
    };
  }).sort((a, b) => {
    if (a.pickType !== b.pickType) return a.pickType === 'bonus' ? 1 : -1;
    if (a.region !== b.region) return REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region);
    return a.seed - b.seed;
  });

  return { ...summary, picks };
}

export async function getTeamPopularity(): Promise<TeamPickCount[]> {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data, error } = await supabase
    .from('entry_picks')
    .select(`
      team_id,
      teams!inner(id, name, region, seed),
      entries!inner(tournament_id)
    `)
    .eq('entries.tournament_id', tournament.id);

  if (error) throw new Error(error.message);

  const counts = new Map<string, TeamPickCount>();
  for (const row of (data || []) as any[]) {
    const team = row.teams;
    const existing = counts.get(team.id);
    if (existing) {
      existing.pickCount += 1;
    } else {
      counts.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        region: team.region,
        seed: team.seed,
        pickCount: 1,
      });
    }
  }

  return Array.from(counts.values()).sort((a, b) => {
    if (b.pickCount !== a.pickCount) return b.pickCount - a.pickCount;
    return a.seed - b.seed;
  });
}

export async function getAdminEntries(): Promise<AdminEntryRow[]> {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data, error } = await supabase
    .from('entries')
    .select(`
      id,
      submitted_at,
      payment_method,
      participant:participants (
        display_name,
        email
      ),
      entry_picks (
        id
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row: any) => ({
    entryId: row.id,
    participantName: row.participant?.display_name || 'Unknown',
    participantEmail: row.participant?.email || null,
    paymentMethod: row.payment_method || null,
    pickCount: row.entry_picks?.length || 0,
    submittedAt: row.submitted_at,
  }));
}
