-- =====================================================================
-- Lendas — Etapa 17: painel admin simples
-- Aplicar DEPOIS das migrations anteriores. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- app_admins
-- ---------------------------------------------------------------------
create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  role text not null default 'admin',
  created_at timestamptz default now()
);

alter table public.app_admins enable row level security;

-- Usuário lê apenas o próprio registro (para checar se é admin).
drop policy if exists "app_admins_select_own" on public.app_admins;
create policy "app_admins_select_own" on public.app_admins
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Função auxiliar: o usuário atual é admin?
-- SECURITY DEFINER evita recursão de RLS ao ser usada nas policies abaixo.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.app_admins a where a.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Policies de leitura para admins (ADITIVAS às policies existentes).
-- ---------------------------------------------------------------------

-- feedback_reports
drop policy if exists "feedback_select_admin" on public.feedback_reports;
create policy "feedback_select_admin" on public.feedback_reports
  for select using (public.is_admin());

-- game_events
drop policy if exists "game_events_select_admin" on public.game_events;
create policy "game_events_select_admin" on public.game_events
  for select using (public.is_admin());

-- campaign_runs
drop policy if exists "campaign_runs_select_admin" on public.campaign_runs;
create policy "campaign_runs_select_admin" on public.campaign_runs
  for select using (public.is_admin());

-- matches
drop policy if exists "matches_select_admin" on public.matches;
create policy "matches_select_admin" on public.matches
  for select using (public.is_admin());

-- ranking_entries (já é leitura pública, mas mantém consistência)
drop policy if exists "ranking_select_admin" on public.ranking_entries;
create policy "ranking_select_admin" on public.ranking_entries
  for select using (public.is_admin());
