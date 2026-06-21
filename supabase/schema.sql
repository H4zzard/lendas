-- =====================================================================
-- Lendas — Schema do banco de dados (MVP)
-- Idioma: português. Códigos de posição: GOL, ZAG, LE, LD, VOL, MC,
-- MEI, PE, PD, SA, CA.
-- Aplicar este arquivo ANTES do seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  year int not null,
  display_name text not null,
  overall int not null default 70,
  created_at timestamptz default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid references public.squads(id) on delete cascade,
  first_name text not null,
  full_name text not null,
  number int not null,
  position text not null,
  overall int not null,
  pace int not null,
  shooting int not null,
  passing int not null,
  defending int not null,
  physical int not null,
  set_piece int not null,
  penalty int not null,
  created_at timestamptz default now(),
  constraint players_position_check check (
    position in ('GOL','ZAG','LE','LD','VOL','MC','MEI','PE','PD','SA','CA')
  )
);

create table if not exists public.user_squads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  formation text not null,
  play_style text not null,
  average_overall int default 0,
  created_at timestamptz default now()
);

create table if not exists public.user_squad_players (
  id uuid primary key default gen_random_uuid(),
  user_squad_id uuid references public.user_squads(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  slot_position text not null,
  created_at timestamptz default now(),
  constraint user_squad_players_slot_check check (
    slot_position in ('GOL','ZAG','LE','LD','VOL','MC','MEI','PE','PD','SA','CA')
  )
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_squad_id uuid references public.user_squads(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  opponent_squad_id uuid references public.squads(id) on delete set null,
  user_score int default 0,
  opponent_score int default 0,
  user_won boolean default false,
  match_events jsonb default '[]'::jsonb,
  stats jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  wins int default 0,
  losses int default 0,
  goals_for int default 0,
  goals_against int default 0,
  best_overall int default 0,
  updated_at timestamptz default now(),
  unique (user_id, tournament_id)
);

-- Índices úteis para consultas comuns.
create index if not exists idx_squads_tournament on public.squads(tournament_id);
create index if not exists idx_players_squad on public.players(squad_id);
create index if not exists idx_user_squads_user on public.user_squads(user_id);
create index if not exists idx_user_squad_players_squad on public.user_squad_players(user_squad_id);
create index if not exists idx_matches_user on public.matches(user_id);
create index if not exists idx_ranking_tournament on public.ranking_entries(tournament_id);

-- ---------------------------------------------------------------------
-- Função + triggers de updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_ranking_entries_updated_at on public.ranking_entries;
create trigger trg_ranking_entries_updated_at
  before update on public.ranking_entries
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.tournaments         enable row level security;
alter table public.squads              enable row level security;
alter table public.players             enable row level security;
alter table public.user_squads         enable row level security;
alter table public.user_squad_players  enable row level security;
alter table public.matches             enable row level security;
alter table public.ranking_entries     enable row level security;

-- profiles: cada usuário gerencia apenas o próprio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- tournaments: leitura pública.
drop policy if exists "tournaments_select_public" on public.tournaments;
create policy "tournaments_select_public" on public.tournaments
  for select using (true);

-- squads: leitura pública.
drop policy if exists "squads_select_public" on public.squads;
create policy "squads_select_public" on public.squads
  for select using (true);

-- players: leitura pública.
drop policy if exists "players_select_public" on public.players;
create policy "players_select_public" on public.players
  for select using (true);

-- user_squads: cada usuário gerencia apenas os próprios times.
drop policy if exists "user_squads_select_own" on public.user_squads;
create policy "user_squads_select_own" on public.user_squads
  for select using (auth.uid() = user_id);

drop policy if exists "user_squads_insert_own" on public.user_squads;
create policy "user_squads_insert_own" on public.user_squads
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_squads_update_own" on public.user_squads;
create policy "user_squads_update_own" on public.user_squads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_squads_delete_own" on public.user_squads;
create policy "user_squads_delete_own" on public.user_squads
  for delete using (auth.uid() = user_id);

-- user_squad_players: acesso permitido apenas se o user_squad pertence ao usuário.
drop policy if exists "user_squad_players_select_own" on public.user_squad_players;
create policy "user_squad_players_select_own" on public.user_squad_players
  for select using (
    exists (
      select 1 from public.user_squads us
      where us.id = user_squad_players.user_squad_id
        and us.user_id = auth.uid()
    )
  );

drop policy if exists "user_squad_players_insert_own" on public.user_squad_players;
create policy "user_squad_players_insert_own" on public.user_squad_players
  for insert with check (
    exists (
      select 1 from public.user_squads us
      where us.id = user_squad_players.user_squad_id
        and us.user_id = auth.uid()
    )
  );

drop policy if exists "user_squad_players_delete_own" on public.user_squad_players;
create policy "user_squad_players_delete_own" on public.user_squad_players
  for delete using (
    exists (
      select 1 from public.user_squads us
      where us.id = user_squad_players.user_squad_id
        and us.user_id = auth.uid()
    )
  );

-- matches: cada usuário lê e insere apenas os próprios.
drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own" on public.matches
  for select using (auth.uid() = user_id);

drop policy if exists "matches_insert_own" on public.matches;
create policy "matches_insert_own" on public.matches
  for insert with check (auth.uid() = user_id);

-- ranking_entries: leitura pública; escrita apenas do próprio ranking.
drop policy if exists "ranking_select_public" on public.ranking_entries;
create policy "ranking_select_public" on public.ranking_entries
  for select using (true);

drop policy if exists "ranking_insert_own" on public.ranking_entries;
create policy "ranking_insert_own" on public.ranking_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "ranking_update_own" on public.ranking_entries;
create policy "ranking_update_own" on public.ranking_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
