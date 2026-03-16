export type Region = 'East' | 'West' | 'South' | 'Midwest';
export type PaymentMethod = 'Venmo' | 'Paypal';

export type Team = {
  id: string;
  name: string;
  region: Region;
  seed: number;
  is_alive: boolean;
  wins: number;
  is_champion: boolean;
  espn_team_id: string | null;
};

export type PublicMetadata = {
  tournamentId: string;
  tournamentName: string;
  year: number;
  lockAt: string;
  locked: boolean;
  regions: Record<Region, Team[]>;
};

export type EntryPickDetail = {
  teamId: string;
  teamName: string;
  region: Region;
  seed: number;
  wins: number;
  isAlive: boolean;
  isChampion: boolean;
  pickType: 'regional' | 'bonus';
  points: number;
  maxRemainingPoints: number;
};

export type EntryDetail = {
  entryId: string;
  participantName: string;
  paymentMethod: PaymentMethod | null;
  submittedAt: string;
  points: number;
  liveTeams: number;
  maxRemainingPoints: number;
  picks: EntryPickDetail[];
};

export type LeaderboardRow = {
  rank: number;
  entryId: string;
  participantName: string;
  paymentMethod: PaymentMethod | null;
  points: number;
  liveTeams: number;
  maxRemainingPoints: number;
  submittedAt: string;
};

export type TeamPickCount = {
  teamId: string;
  teamName: string;
  region: Region;
  seed: number;
  pickCount: number;
};

export type AdminEntryRow = {
  entryId: string;
  participantName: string;
  participantEmail: string | null;
  paymentMethod: string | null;
  pickCount: number;
  submittedAt: string;
};
