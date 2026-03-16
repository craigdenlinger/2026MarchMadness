import { NextRequest, NextResponse } from 'next/server';
import { getCurrentTournament, getTeamsForTournament } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { PaymentMethod, Region } from '@/lib/types';

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

const VALID_PAYMENT_METHODS: PaymentMethod[] = ['Venmo', 'Paypal'];

type Body = {
  displayName: string;
  paymentMethod: PaymentMethod;
  regionalPicks: Record<Region, string[]>;
  bonusPickTeamId: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const tournament = await getCurrentTournament();

    if (new Date(tournament.lock_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Entries are locked.' }, { status: 400 });
    }

    const displayName = body.displayName?.trim();
    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
    }

    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json({ error: 'Choose Venmo or Paypal.' }, { status: 400 });
    }

    const teams = await getTeamsForTournament(tournament.id);
    const validTeamIds = new Set(teams.map((team) => team.id));

    for (const region of REGIONS) {
      const picks = body.regionalPicks?.[region] || [];
      if (picks.length !== 4) {
        return NextResponse.json({ error: `${region} must have exactly 4 picks.` }, { status: 400 });
      }
      const regionTeamIds = new Set(teams.filter((team) => team.region === region).map((team) => team.id));
      if (!picks.every((teamId) => regionTeamIds.has(teamId))) {
        return NextResponse.json({ error: `${region} contains an invalid team.` }, { status: 400 });
      }
    }

    if (!body.bonusPickTeamId || !validTeamIds.has(body.bonusPickTeamId)) {
      return NextResponse.json({ error: 'Bonus pick is required.' }, { status: 400 });
    }

    const allPicks = [...REGIONS.flatMap((region) => body.regionalPicks[region] || []), body.bonusPickTeamId];
    if (allPicks.length !== 17) {
      return NextResponse.json({ error: 'Exactly 17 picks are required.' }, { status: 400 });
    }

    const unique = new Set(allPicks);
    if (unique.size !== 17) {
      return NextResponse.json({ error: 'All 17 picks must be different teams.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .ilike('display_name', displayName)
      .maybeSingle();

    let participantId = existingParticipant?.id;
    if (!participantId) {
      const { data: insertedParticipant, error: participantError } = await supabase
        .from('participants')
        .insert({ display_name: displayName })
        .select('id')
        .single();
      if (participantError) throw participantError;
      participantId = insertedParticipant.id;
    }

    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('participant_id', participantId)
      .maybeSingle();

    if (existingEntry) {
      return NextResponse.json({ error: 'This participant already submitted an entry. Entries are final.' }, { status: 400 });
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        tournament_id: tournament.id,
        participant_id: participantId,
        payment_method: body.paymentMethod,
        submitted_at: new Date().toISOString(),
        is_final: true,
      })
      .select('id')
      .single();

    if (entryError) throw entryError;

    const pickRows = REGIONS.flatMap((region) => (body.regionalPicks[region] || []).map((teamId) => ({
      entry_id: entry.id,
      team_id: teamId,
      region,
      pick_type: 'regional',
    })));

    pickRows.push({
      entry_id: entry.id,
      team_id: body.bonusPickTeamId,
      region: teams.find((team) => team.id === body.bonusPickTeamId)!.region,
      pick_type: 'bonus',
    });

    const { error: picksError } = await supabase.from('entry_picks').insert(pickRows);
    if (picksError) throw picksError;

    return NextResponse.json({ success: true, entryId: entry.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit entry.' }, { status: 500 });
  }
}
