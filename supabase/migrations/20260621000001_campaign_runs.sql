-- =====================================================================
-- Lendas — Etapa 10.1: campanha (fase de grupos + mata-mata)
-- Aplicar DEPOIS de schema.sql e seed.sql.
-- Idempotente (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela campaign_runs
-- ---------------------------------------------------------------------
create table if not exists public.campaign_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  user_squad_id uuid references public.user_squads(id) on delete cascade,
  status text not null default 'active',
  current_stage text not null default 'grupos',
  group_points int default 0,
  group_wins int default 0,
  group_draws int default 0,
  group_losses int default 0,
  goals_for int default 0,
  goals_against int default 0,
  group_table jsonb default '[]'::jsonb,
  bracket jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Novas colunas em matches
-- ---------------------------------------------------------------------
alter table public.matches
  add column if not exists campaign_run_id uuid references public.campaign_runs(id) on delete cascade;
alter table public.matches
  add column if not exists stage text;
alter table public.matches
  add column if not exists match_order int;
alter table public.matches
  add column if not exists is_knockout boolean default false;

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists campaign_runs_user_id_idx on public.campaign_runs(user_id);
create index if not exists matches_campaign_run_id_idx on public.matches(campaign_run_id);
create index if not exists matches_stage_idx on public.matches(stage);

-- ---------------------------------------------------------------------
-- Trigger updated_at (reutiliza set_updated_at do schema.sql)
-- ---------------------------------------------------------------------
drop trigger if exists trg_campaign_runs_updated_at on public.campaign_runs;
create trigger trg_campaign_runs_updated_at
  before update on public.campaign_runs
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: usuário gerencia apenas as próprias campanhas
-- ---------------------------------------------------------------------
alter table public.campaign_runs enable row level security;

drop policy if exists "campaign_runs_select_own" on public.campaign_runs;
create policy "campaign_runs_select_own" on public.campaign_runs
  for select using (auth.uid() = user_id);

drop policy if exists "campaign_runs_insert_own" on public.campaign_runs;
create policy "campaign_runs_insert_own" on public.campaign_runs
  for insert with check (auth.uid() = user_id);

drop policy if exists "campaign_runs_update_own" on public.campaign_runs;
create policy "campaign_runs_update_own" on public.campaign_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
