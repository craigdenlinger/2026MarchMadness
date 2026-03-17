import { createClient } from '@supabase/supabase-js';
import type {
  AdminEntryRow,
  EntryDetail,
  LeaderboardRow,
  PublicMetadata,
  Region,
  TeamPopularityRow,
} from '@/lib/types';

export const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdminSingleton) return supabaseAdminSingleton;

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseAdminSingleton = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminSingleton;
}

function getTournamentYear() {
  return Number(process.env.TOURNAMENT_YEAR || 2026);
}

export async function getCurrentTournament() {
  const supabase = getSupabaseAdmin();
  const year = getTournamentYear();

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('year', year)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`No tournament found for year ${year}`);
  }

  return data;
}

export async function getLockStatus() {
  const tournament = await getCurrentTournament();
  const now = new Date();
  const lockAt = tournament.lock_at ? new Date(tournament.lock_at) : null;
  const locked = lockAt ? now >= lockAt : false;

  return {
    tournament,
    lockAt: tournament.lock_at || null,
    locked,
  };
}

export async function getPublicMetadata(): Promise<PublicMetadata> {
  const supabase = getSupabaseAdmin();
  const { tournament, lockAt, locked } = await getLockStatus();

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, region, seed')
    .eq('tournament_id', tournament.id)
    .order('seed', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  const regions: Record<Region, Array<{ id: string; name: string; seed: number; region: Region }>> =
    {
      East: [],
      West: [],
      South: [],
      Midwest: [],
    };

  for (const team of teams || []) {
    const region = team.region as Region;
    if (REGIONS.includes(region)) {
      regions[region].push({
        id: team.id,
        name: team.name,
        seed: team.seed,
        region,
      });
    }
  }

  return {
    tournamentYear: tournament.year,
    tournamentName: tournament.name || `${tournament.year} NCAA Tournament`,
    lockAt,
    locked,
    regions,
  };
}

function calculateTeamPoints(seed: number, wins: number, isChampion: boolean) {
  if (wins <= 0) return 0;
  if (isChampion) {
    return seed * (wins - 1) + seed * 5;
  }
  return seed * wins;
}

function calculateMaxRemainingPoints(
  seed: number,
  wins: number,
  isAlive: boolean,
  isChampion: boolean
) {
  if (isChampion) return 0;
  if (!isAlive) return 0;

  const totalWinsNeededForTitle = 6;
  const remainingWins = Math.max(0, totalWinsNeededForTitle - wins);

  if (remainingWins === 0) return 0;

  if (remainingWins === 1) {
    return seed * 5;
  }

  return seed * (remainingWins - 1) + seed * 5;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      id,
      payment_method,
      submitted_at,
      participant:participants (
        display_name,
        email
      ),
      entry_picks (
        pick_type,
        region,
        team:teams (
          id,
          name,
          region,
          seed,
          wins,
          is_alive,
          is_champion
        )
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('submitted_at', { ascending: true });

  if (error) throw error;

  const rows: LeaderboardRow[] = (entries || []).map((entry: any) => {
    const picks = (entry.entry_picks || []).map((pick: any) => {
      const team = pick.team;
      const seed = team?.seed || 0;
      const wins = team?.wins || 0;
      const isAlive = !!team?.is_alive;
      const isChampion = !!team?.is_champion;

      return {
        points: calculateTeamPoints(seed, wins, isChampion),
        isAlive,
        maxRemainingPoints: calculateMaxRemainingPoints(seed, wins, isAlive, isChampion),
      };
    });

    const points = picks.reduce((sum: number, pick: any) => sum + pick.points, 0);
    const liveTeams = picks.filter((pick: any) => pick.isAlive).length;
    const maxRemainingPoints = picks.reduce(
      (sum: number, pick: any) => sum + pick.maxRemainingPoints,
      0
    );

    return {
      entryId: entry.id,
      participantName: entry.participant?.display_name || 'Unknown',
      participantEmail: entry.participant?.email || null,
      paymentMethod: entry.payment_method || null,
      points,
      liveTeams,
      maxRemainingPoints,
      submittedAt: entry.submitted_at,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.liveTeams !== a.liveTeams) return b.liveTeams - a.liveTeams;
    if (b.maxRemainingPoints !== a.maxRemainingPoints) {
      return b.maxRemainingPoints - a.maxRemainingPoints;
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  return rows;
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

  if (error) throw error;

  return (data || []).map((row: any) => ({
    entryId: row.id,
    participantName: row.participant?.display_name || 'Unknown',
    participantEmail: row.participant?.email || null,
    paymentMethod: row.payment_method || null,
    pickCount: row.entry_picks?.length || 0,
    submittedAt: row.submitted_at,
  }));
}

export async function getEntryDetail(entryId: string): Promise<EntryDetail | null> {
  const supabase = getSupabaseAdmin();

  const { data: entry, error } = await supabase
    .from('entries')
    .select(`
      id,
      payment_method,
      submitted_at,
      participant:participants (
        display_name,
        email
      ),
      entry_picks (
        pick_type,
        region,
        team:teams (
          id,
          name,
          region,
          seed,
          wins,
          is_alive,
          is_champion
        )
      )
    `)
    .eq('id', entryId)
    .maybeSingle();

  if (error) throw error;
  if (!entry) return null;

  const picks = (entry.entry_picks || []).map((pick: any) => {
    const team = pick.team;
    const seed = team?.seed || 0;
    const wins = team?.wins || 0;
    const isAlive = !!team?.is_alive;
    const isChampion = !!team?.is_champion;
    const points = calculateTeamPoints(seed, wins, isChampion);
    const maxRemainingPoints = calculateMaxRemainingPoints(seed, wins, isAlive, isChampion);

    return {
      teamId: team?.id || '',
      teamName: team?.name || 'Unknown',
      region: pick.region || team?.region || '',
      seed,
      wins,
      points,
      isAlive,
      isChampion,
      maxRemainingPoints,
      pickType: pick.pick_type as 'regional' | 'bonus',
    };
  });

  const points = picks.reduce((sum, pick) => sum + pick.points, 0);
  const liveTeams = picks.filter((pick) => pick.isAlive).length;
  const maxRemainingPoints = picks.reduce(
    (sum, pick) => sum + pick.maxRemainingPoints,
    0
  );

  return {
    entryId: entry.id,
    participantName: entry.participant?.display_name || 'Unknown',
    participantEmail: entry.participant?.email || null,
    paymentMethod: entry.payment_method || null,
    points,
    liveTeams,
    maxRemainingPoints,
    picks,
  };
}

export async function getTeamPopularity(): Promise<TeamPopularityRow[]> {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data, error } = await supabase
    .from('entry_picks')
    .select(`
      team_id,
      team:teams (
        id,
        name,
        region,
        seed
      ),
      entry:entries!inner (
        tournament_id
      )
    `)
    .eq('entry.tournament_id', tournament.id);

  if (error) throw error;

  const counts = new Map<
    string,
    { teamId: string; teamName: string; region: string; seed: number; count: number }
  >();

  for (const row of data || []) {
    const team = (row as any).team;
    if (!team?.id) continue;

    const existing = counts.get(team.id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(team.id, {
        teamId: team.id,
        teamName: team.name || 'Unknown',
        region: team.region || '',
        seed: team.seed || 0,
        count: 1,
      });
    }
  }

  return Array.from(counts.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.seed !== b.seed) return a.seed - b.seed;
    return a.teamName.localeCompare(b.teamName);
  });
}

export async function getTeamsForTournament() {
  const supabase = getSupabaseAdmin();
  const tournament = await getCurrentTournament();

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('region', { ascending: true })
    .order('seed', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export function normalizeTeamName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9/ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
