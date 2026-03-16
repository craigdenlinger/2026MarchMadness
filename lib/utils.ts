const TEAM_ALIAS_MAP: Record<string, string> = {
  'ohio st': 'ohio st',
  'ohio state': 'ohio st',
  'michigan st': 'michigan st',
  'michigan state': 'michigan st',
  'iowa st': 'iowa st',
  'iowa state': 'iowa st',
  'utah st': 'utah st',
  'utah state': 'utah st',
  'wright st': 'wright st',
  'wright state': 'wright st',
  'north dakota st': 'north dakota st',
  'north dakota state': 'north dakota st',
  'kennesaw st': 'kennesaw st',
  'kennesaw state': 'kennesaw st',
  'tennessee st': 'tennessee st',
  'tennessee state': 'tennessee st',
  'saint marys': 'st marys',
  'st marys': 'st marys',
  'saint louis': 'st louis',
  'st louis': 'st louis',
  'south florida': 'south florida',
  'south fl': 'south florida',
  'usf': 'south florida',
  'california baptist': 'cal baptist',
  'cal baptist': 'cal baptist',
  'liu': 'long island',
  'long island': 'long island',
  'queens': 'queens nc',
  'queens nc': 'queens nc',
  'queens n c': 'queens nc',
  'queens university of charlotte': 'queens nc',
  'miami fl': 'miami fl',
  'miami florida': 'miami fl',
  'miami ohio': 'miami ohio',
  'nc state': 'nc state',
};

export function normalizeTeamName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/saint/g, 'st')
    .replace(/state/g, 'st')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return TEAM_ALIAS_MAP[normalized] || normalized;
}

export function assertEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function isLocked(lockAt: string) {
  return new Date(lockAt).getTime() <= Date.now();
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
