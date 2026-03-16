export type Region = 'East' | 'West' | 'South' | 'Midwest';

export type PaymentMethod = 'Venmo' | 'Paypal';

export type TeamOption = {
  id: string;
  name: string;
  seed: number;
  region: Region;
};

export type PublicMetadata = {
  tournamentYear: number;
  tournamentName: string;
  lockAt: string | null;
  locked: boolean;
  regions: Record<Region, TeamOption[]>;
};

export type LeaderboardRow = {
  entryId: string;
  participantName: string;
  participantEmail: string | null;
  paymentMethod: string | null;
  points: number;
  liveTeams: number;
  maxRemainingPoints: number;
  submittedAt: string;
};

export type AdminEntryRow = {
  entryId: string;
  participantName: string;
  participantEmail: string | null;
  paymentMethod: string | null;
  pickCount: number;
  submittedAt: string;
};

export type EntryPickDetail = {
  teamId: string;
  teamName: string;
  region: string;
  seed: number;
  wins: number;
  points: number;
  isAlive: boolean;
  isChampion: boolean;
  maxRemainingPoints: number;
  pickType: 'regional' | 'bonus';
};

export type EntryDetail = {
  entryId: string;
  participantName: string;
  participantEmail: string | null;
  paymentMethod: string | null;
  points: number;
  liveTeams: number;
  maxRemainingPoints: number;
  picks: EntryPickDetail[];
};

export type TeamPopularityRow = {
  teamId: string;
  teamName: string;
  region: string;
  seed: number;
  count: number;
};
