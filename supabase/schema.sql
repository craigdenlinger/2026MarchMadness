create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pick_type') then
    create type pick_type as enum ('regional', 'bonus');
  end if;
end $$;

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  name text not null,
  lock_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  region text not null check (region in ('East', 'West', 'South', 'Midwest')),
  seed integer not null check (seed between 1 and 16),
  wins integer not null default 0,
  is_alive boolean not null default true,
  is_champion boolean not null default false,
  espn_team_id text null,
  created_at timestamptz not null default now()
);

create index if not exists teams_tournament_id_idx on teams(tournament_id);
create index if not exists teams_normalized_name_idx on teams(normalized_name);
create unique index if not exists teams_tournament_unique_name_idx on teams(tournament_id, normalized_name);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  payment_method text null check (payment_method in ('Venmo', 'Paypal')),
  submitted_at timestamptz not null default now(),
  is_final boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tournament_id, participant_id)
);

create table if not exists entry_picks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  region text not null check (region in ('East', 'West', 'South', 'Midwest')),
  pick_type pick_type not null,
  created_at timestamptz not null default now(),
  unique (entry_id, team_id)
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  external_game_id text null unique,
  winner_team_id uuid not null references teams(id) on delete cascade,
  loser_team_id uuid not null references teams(id) on delete cascade,
  round_number integer not null,
  completed_at timestamptz not null,
  is_championship boolean not null default false,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table entries add column if not exists payment_method text null;
alter table entries drop constraint if exists entries_payment_method_check;
alter table entries add constraint entries_payment_method_check check (payment_method in ('Venmo', 'Paypal'));

insert into tournaments (year, name, lock_at)
values (
  coalesce(nullif(current_setting('app.settings.tournament_year', true), ''), extract(year from now())::text)::integer,
  'March Madness Pool',
  now() + interval '7 days'
)
on conflict (year) do nothing;
