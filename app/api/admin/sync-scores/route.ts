import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTournament, getTeamsForTournament } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { normalizeTeamName } from '@/lib/utils';

function getRecentDates() {
  const dates: string[] = [];
  for (let offset = -7; offset <= 1; offset += 1) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }
  return dates;
}

function isFirstFourGame(competition: any) {
  const competitors = competition.competitors || [];
  if (competitors.length !== 2) return false;
  const seeds = competitors.map((c: any) => Number(c?.seed ?? c?.tournamentSeed ?? 0)).filter(Boolean);
  if (seeds.length !== 2) return false;
  return seeds[0] === seeds[1] && [11, 16].includes(seeds[0]);
}

function findPlaceholderTeam(mutableTeams: any[], competition: any) {
  const competitors = competition.competitors || [];
  const seed = Number(competitors[0]?.seed ?? competitors[0]?.tournamentSeed ?? 0);
  const names: string[] = competitors.map((c: any) => normalizeTeamName(c.team?.displayName || c.team?.shortDisplayName || ''));

  return mutableTeams.find((team) => {
    if (team.seed !== seed) return false;
    if (!/winner/i.test(team.name) && !team.name.includes('/')) return false;
    const normalizedPlaceholder = normalizeTeamName(team.name);
    return names.some((name: string) => normalizedPlaceholder.includes(name));
  });
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req, 'SYNC_SECRET') && !isAuthorized(req, 'ADMIN_SECRET') && !isAuthorized(req, 'CRON_SECRET')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.ESPN_SYNC_ENABLED !== 'true') {
      return NextResponse.json({ error: 'ESPN sync is disabled. Set ESPN_SYNC_ENABLED=true to use it.' }, { status: 400 });
    }

    const tournament = await getCurrentTournament();
    const teams = await getTeamsForTournament();
    const mutableTeams = (teams as any[]).map((team) => ({ ...(team as any) }));
    const supabase = getSupabaseAdmin();

    let insertedGames = 0;
    let updatedTeams = 0;
    let promotedPlayInSlots = 0;

    for (const date of getRecentDates()) {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}&groups=100`;
      const response = await fetch(url, { next: { revalidate: 0 } });
      if (!response.ok) continue;
      const payload = await response.json();
      const events = payload.events || [];

      for (const event of events) {
        const competition = event.competitions?.[0];
        if (!competition || competition.status?.type?.completed !== true) continue;
        const notesText = (competition.notes || []).map((note: any) => note.headline || '').join(' ');
        const isTournament = /ncaa tournament|march madness/i.test(notesText + ' ' + (competition.type?.abbreviation || '') + ' ' + (event.name || ''));
        if (!isTournament) continue;

        const eventId = String(event.id);
        const { data: existingGame } = await supabase.from('games').select('id').eq('external_game_id', eventId).maybeSingle();
        if (existingGame) continue;

        const competitors = competition.competitors || [];
        const winnerComp = competitors.find((c: any) => c.winner);
        const loserComp = competitors.find((c: any) => !c.winner);
        if (!winnerComp || !loserComp) continue;

        if (isFirstFourGame(competition)) {
          const placeholderTeam = findPlaceholderTeam(mutableTeams, competition);
          if (placeholderTeam) {
            const winnerName = winnerComp.team?.displayName || winnerComp.team?.shortDisplayName;
            const winnerEspnId = winnerComp.team?.id ? String(winnerComp.team.id) : null;
            placeholderTeam.name = winnerName;
            placeholderTeam.espn_team_id = winnerEspnId;

            await supabase
              .from('teams')
              .update({ name: winnerName, espn_team_id: winnerEspnId, is_alive: true })
              .eq('id', placeholderTeam.id);

            promotedPlayInSlots += 1;
            updatedTeams += 1;
          }
          continue;
        }

        const byId = new Map(mutableTeams.filter((t) => t.espn_team_id).map((team) => [String(team.espn_team_id), team]));
        const byName = new Map(mutableTeams.map((team) => [normalizeTeamName(team.name), team]));

        const winnerName = winnerComp.team?.displayName || winnerComp.team?.shortDisplayName || '';
        const loserName = loserComp.team?.displayName || loserComp.team?.shortDisplayName || '';
        const winnerTeam = byId.get(String(winnerComp.team?.id)) || byName.get(normalizeTeamName(winnerName));
        const loserTeam = byId.get(String(loserComp.team?.id)) || byName.get(normalizeTeamName(loserName));
        if (!winnerTeam || !loserTeam) continue;

        const isChampionship = /championship/i.test(event.name || '') || /national championship/i.test(notesText);

        winnerTeam.wins = (winnerTeam.wins || 0) + 1;
        winnerTeam.is_champion = isChampionship;
        winnerTeam.is_alive = true;
        winnerTeam.espn_team_id = winnerComp.team?.id ? String(winnerComp.team.id) : winnerTeam.espn_team_id;
        winnerTeam.name = winnerName || winnerTeam.name;

        loserTeam.is_alive = false;
        loserTeam.espn_team_id = loserComp.team?.id ? String(loserComp.team.id) : loserTeam.espn_team_id;
        loserTeam.name = loserName || loserTeam.name;

        await supabase.from('teams').update({
          name: winnerTeam.name,
          espn_team_id: winnerTeam.espn_team_id,
          wins: winnerTeam.wins,
          is_alive: true,
          is_champion: isChampionship,
        }).eq('id', winnerTeam.id);
        await supabase.from('teams').update({
          name: loserTeam.name,
          espn_team_id: loserTeam.espn_team_id,
          is_alive: false,
        }).eq('id', loserTeam.id);
        await supabase.from('games').insert({
          external_game_id: eventId,
          winner_team_id: winnerTeam.id,
          loser_team_id: loserTeam.id,
          round_number: Number(competition.status?.period || 0),
          completed_at: competition.date,
          is_championship: isChampionship,
          source: 'espn',
        });

        insertedGames += 1;
        updatedTeams += 2;
      }
    }

    return NextResponse.json({ success: true, insertedGames, updatedTeams, promotedPlayInSlots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to sync scores.' }, { status: 500 });
  }
}
