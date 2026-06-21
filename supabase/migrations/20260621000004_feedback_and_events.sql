-- =====================================================================
-- Lendas — Etapa 16: feedback dos jogadores + métricas básicas
-- Aplicar DEPOIS das migrations anteriores. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- feedback_reports
-- ---------------------------------------------------------------------
create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null default 'feedback',
  message text not null,
  page_url text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists feedback_reports_user_id_idx
  on public.feedback_reports(user_id);

alter table public.feedback_reports enable row level security;

drop policy if exists "feedback_insert_own" on public.feedback_reports;
create policy "feedback_insert_own" on public.feedback_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "feedback_select_own" on public.feedback_reports;
create policy "feedback_select_own" on public.feedback_reports
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- game_events
-- ---------------------------------------------------------------------
create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  page_url text,
  created_at timestamptz default now()
);

create index if not exists game_events_user_id_idx
  on public.game_events(user_id);
create index if not exists game_events_event_name_idx
  on public.game_events(event_name);

alter table public.game_events enable row level security;

drop policy if exists "game_events_insert_own" on public.game_events;
create policy "game_events_insert_own" on public.game_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "game_events_select_own" on public.game_events;
create policy "game_events_select_own" on public.game_events
  for select using (auth.uid() = user_id);
