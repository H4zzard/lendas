-- =====================================================================
-- Lendas — Etapa 12: compartilhamento público de campanhas
-- Aplicar DEPOIS das migrations anteriores.
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colunas de compartilhamento
-- ---------------------------------------------------------------------
alter table public.campaign_runs
  add column if not exists public_share_id text unique;
alter table public.campaign_runs
  add column if not exists is_public boolean default false;
alter table public.campaign_runs
  add column if not exists shared_at timestamptz;

create index if not exists campaign_runs_public_share_id_idx
  on public.campaign_runs(public_share_id);
create index if not exists campaign_runs_is_public_idx
  on public.campaign_runs(is_public);

-- ---------------------------------------------------------------------
-- Policies públicas (somente leitura) para campanhas marcadas is_public.
-- São ADITIVAS às policies "own" existentes (policies permissivas: OR).
-- O e-mail nunca é exposto: o perfil público vem da view public_profiles.
-- ---------------------------------------------------------------------

-- campaign_runs: leitura pública apenas quando is_public = true
drop policy if exists "campaign_runs_select_public" on public.campaign_runs;
create policy "campaign_runs_select_public" on public.campaign_runs
  for select using (is_public = true);

-- matches de uma campanha pública
drop policy if exists "matches_select_public_share" on public.matches;
create policy "matches_select_public_share" on public.matches
  for select using (
    campaign_run_id is not null
    and exists (
      select 1 from public.campaign_runs c
      where c.id = matches.campaign_run_id
        and c.is_public = true
    )
  );

-- user_squads vinculadas a uma campanha pública
drop policy if exists "user_squads_select_public_share" on public.user_squads;
create policy "user_squads_select_public_share" on public.user_squads
  for select using (
    exists (
      select 1 from public.campaign_runs c
      where c.user_squad_id = user_squads.id
        and c.is_public = true
    )
  );

-- user_squad_players vinculados a um user_squad de campanha pública
drop policy if exists "user_squad_players_select_public_share" on public.user_squad_players;
create policy "user_squad_players_select_public_share" on public.user_squad_players
  for select using (
    exists (
      select 1
      from public.user_squads us
      join public.campaign_runs c on c.user_squad_id = us.id
      where us.id = user_squad_players.user_squad_id
        and c.is_public = true
    )
  );
