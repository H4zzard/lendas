-- =====================================================================
-- Lendas — Etapa 21: Modo Amigos v1 (desafio assíncrono por código/link)
-- Aplicar DEPOIS das migrations anteriores. Idempotente.
-- =====================================================================

create table if not exists public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  opponent_id uuid references auth.users(id) on delete set null,
  creator_user_squad_id uuid references public.user_squads(id) on delete set null,
  opponent_user_squad_id uuid references public.user_squads(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  status text not null default 'waiting',
  winner_user_id uuid references auth.users(id) on delete set null,
  creator_score int,
  opponent_score int,
  shared_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists friend_challenges_code_idx on public.friend_challenges(code);
create index if not exists friend_challenges_creator_id_idx on public.friend_challenges(creator_id);
create index if not exists friend_challenges_opponent_id_idx on public.friend_challenges(opponent_id);
create index if not exists friend_challenges_tournament_id_idx on public.friend_challenges(tournament_id);
create index if not exists friend_challenges_status_idx on public.friend_challenges(status);

drop trigger if exists trg_friend_challenges_updated_at on public.friend_challenges;
create trigger trg_friend_challenges_updated_at
  before update on public.friend_challenges
  for each row execute function public.set_updated_at();

alter table public.friend_challenges enable row level security;

-- Leitura: participantes sempre; desafios waiting/completed visíveis para
-- usuários autenticados (necessário para entrar e ver resultado).
drop policy if exists "friend_challenges_select" on public.friend_challenges;
create policy "friend_challenges_select" on public.friend_challenges
  for select using (
    creator_id = auth.uid()
    or opponent_id = auth.uid()
    or status in ('waiting', 'completed')
  );

-- Inserção: só o próprio usuário como criador.
drop policy if exists "friend_challenges_insert" on public.friend_challenges;
create policy "friend_challenges_insert" on public.friend_challenges
  for insert with check (creator_id = auth.uid());

-- Atualização: criador (cancelar/gerenciar) ou quem entra num desafio waiting.
-- with check garante que o oponente só pode se colocar como opponent_id.
drop policy if exists "friend_challenges_update" on public.friend_challenges;
create policy "friend_challenges_update" on public.friend_challenges
  for update using (
    creator_id = auth.uid() or status = 'waiting'
  ) with check (
    creator_id = auth.uid() or opponent_id = auth.uid()
  );

-- ---------------------------------------------------------------------
-- Acesso de leitura aos times (user_squads / user_squad_players) ligados
-- a desafios, para simular e exibir resultados sem expor e-mail.
-- ADITIVAS às policies "own" já existentes.
-- ---------------------------------------------------------------------
drop policy if exists "user_squads_select_challenge" on public.user_squads;
create policy "user_squads_select_challenge" on public.user_squads
  for select using (
    exists (
      select 1 from public.friend_challenges fc
      where (fc.creator_user_squad_id = user_squads.id
             or fc.opponent_user_squad_id = user_squads.id)
        and (fc.creator_id = auth.uid()
             or fc.opponent_id = auth.uid()
             or fc.status in ('waiting', 'completed'))
    )
  );

drop policy if exists "user_squad_players_select_challenge" on public.user_squad_players;
create policy "user_squad_players_select_challenge" on public.user_squad_players
  for select using (
    exists (
      select 1
      from public.user_squads us
      join public.friend_challenges fc
        on (fc.creator_user_squad_id = us.id
            or fc.opponent_user_squad_id = us.id)
      where us.id = user_squad_players.user_squad_id
        and (fc.creator_id = auth.uid()
             or fc.opponent_id = auth.uid()
             or fc.status in ('waiting', 'completed'))
    )
  );
