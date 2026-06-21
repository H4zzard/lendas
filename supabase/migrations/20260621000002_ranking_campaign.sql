-- =====================================================================
-- Lendas — Etapa 11: ranking real por campeonato
-- Aplicar DEPOIS das migrations anteriores.
-- Idempotente (ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- campaign_runs: controle de aplicação no ranking
-- ---------------------------------------------------------------------
alter table public.campaign_runs
  add column if not exists ranking_applied boolean default false;
alter table public.campaign_runs
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------
-- ranking_entries: estatísticas acumuladas por campanha
-- ---------------------------------------------------------------------
alter table public.ranking_entries
  add column if not exists campaigns_played int default 0;
alter table public.ranking_entries
  add column if not exists championships int default 0;
alter table public.ranking_entries
  add column if not exists best_campaign_wins int default 0;
alter table public.ranking_entries
  add column if not exists best_goal_difference int default 0;

-- ---------------------------------------------------------------------
-- View pública só com dados seguros do perfil (nome de exibição/username).
-- profiles tem RLS "select own" (protege o e-mail). Para o ranking público
-- expomos APENAS id/username/display_name via view, sem vazar e-mail.
-- security_invoker = false: a view roda como dona (postgres) e ignora a RLS
-- de profiles, retornando somente as colunas seguras selecionadas aqui.
-- ---------------------------------------------------------------------
create or replace view public.public_profiles
  with (security_invoker = false) as
  select id, username, display_name
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;
