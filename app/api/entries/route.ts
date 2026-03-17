import { NextResponse } from 'next/server';
import { REGIONS, getLockStatus, getSupabaseAdmin } from '@/lib/data';
import type { PaymentMethod, Region } from '@/lib/types';

type EntryRequestBody = {
  displayName?: string;
  email?: string;
  paymentMethod?: PaymentMethod;
  regionalPicks?: Record<Region, string[]>;
  bonusPickTeamId?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as EntryRequestBody;

    const { locked, tournament } = await getLockStatus();
    if (locked) {
      return NextResponse.json(
        { error: 'Entries are locked.' },
        { status: 403 }
      );
    }

    const displayName = body.displayName?.trim();
    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required.' },
        { status: 400 }
      );
    }

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    if (
      body.paymentMethod !== 'Venmo' &&
      body.paymentMethod !== 'Paypal'
    ) {
      return NextResponse.json(
        { error: 'Payment method is required.' },
        { status: 400 }
      );
    }

    const regionalPicks = body.regionalPicks;
    const bonusPickTeamId = body.bonusPickTeamId;

    if (!regionalPicks || !bonusPickTeamId) {
      return NextResponse.json(
        { error: 'All picks are required.' },
        { status: 400 }
      );
    }

    for (const region of REGIONS) {
      if (!Array.isArray(regionalPicks[region]) || regionalPicks[region].length !== 4) {
        return NextResponse.json(
          { error: `You must select exactly 4 teams in ${region}.` },
          { status: 400 }
        );
      }
    }

    const allRegionalIds = REGIONS.flatMap((region) => regionalPicks[region]);
    const allPickedIds = [...allRegionalIds, bonusPickTeamId];

    const uniqueIds = new Set(allPickedIds);
    if (uniqueIds.size !== 17) {
      return NextResponse.json(
        { error: 'All 17 picks must be different teams.' },
        { status: 400 }
      );
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, region')
      .eq('tournament_id', (tournament as any).id);

    if (teamsError) {
      return NextResponse.json(
        { error: 'Failed to validate teams.' },
        { status: 500 }
      );
    }

    const teamMap = new Map((teams || []).map((team: any) => [team.id, team]));

    for (const region of REGIONS) {
      for (const teamId of regionalPicks[region]) {
        const team = teamMap.get(teamId);
        if (!team) {
          return NextResponse.json(
            { error: 'One or more selected teams are invalid.' },
            { status: 400 }
          );
        }
        if (team.region !== region) {
          return NextResponse.json(
            { error: `A selected team does not belong to the ${region} region.` },
            { status: 400 }
          );
        }
      }
    }

    const bonusTeam = teamMap.get(bonusPickTeamId);
    if (!bonusTeam) {
      return NextResponse.json(
        { error: 'Bonus pick is invalid.' },
        { status: 400 }
      );
    }

    const { data: existingParticipant, error: participantLookupError } = await supabase
      .from('participants')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (participantLookupError) {
      return NextResponse.json(
        { error: 'Failed to look up participant.' },
        { status: 500 }
      );
    }

    let participantId = existingParticipant?.id;

    if (!participantId) {
      const { data: newParticipant, error: participantInsertError } = await (supabase as any)
        .from('participants')
        .insert({
          display_name: displayName,
          email,
        })
        .select('id')
        .single();

      if (participantInsertError || !newParticipant) {
        return NextResponse.json(
          { error: 'Failed to create participant.' },
          { status: 500 }
        );
      }

      participantId = newParticipant.id;
    } else {
      await (supabase as any)
        .from('participants')
        .update({
          display_name: displayName,
          email,
        })
        .eq('id', participantId);
    }

    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('entries')
      .select('id')
      .eq('participant_id', participantId)
      .eq('tournament_id', (tournament as any).id)
      .maybeSingle();

    if (existingEntryError) {
      return NextResponse.json(
        { error: 'Failed to check for existing entry.' },
        { status: 500 }
      );
    }

    if (existingEntry) {
      return NextResponse.json(
        { error: 'An entry has already been submitted for this email address.' },
        { status: 400 }
      );
    }

    const { data: entry, error: entryInsertError } = await (supabase as any)
      .from('entries')
      .insert({
        participant_id: participantId,
        tournament_id: (tournament as any).id,
        payment_method: body.paymentMethod,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (entryInsertError || !entry) {
      return NextResponse.json(
        { error: 'Failed to create entry.' },
        { status: 500 }
      );
    }

    const pickRows = [
      ...REGIONS.flatMap((region) =>
        regionalPicks[region].map((teamId) => ({
          entry_id: entry.id,
          team_id: teamId,
          pick_type: 'regional',
          region,
        }))
      ),
      {
        entry_id: entry.id,
        team_id: bonusPickTeamId,
        pick_type: 'bonus',
        region: bonusTeam.region,
      },
    ];

    const { error: picksInsertError } = await (supabase as any)
      .from('entry_picks')
      .insert(pickRows);

    if (picksInsertError) {
      return NextResponse.json(
        { error: 'Failed to save picks.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entryId: entry.id,
      message: 'Your entry has been submitted successfully.',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
