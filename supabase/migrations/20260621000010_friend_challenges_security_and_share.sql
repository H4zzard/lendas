-- =====================================================================
-- Lendas — Etapa 22: blindagem do Modo Amigos
-- Aplicar DEPOIS das migrations anteriores. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Remove a policy ampla de UPDATE: usuários comuns NÃO podem mais atualizar
-- friend_challenges diretamente. A conclusão passa pela função SECURITY
-- DEFINER abaixo (que valida tudo no servidor do banco).
-- ---------------------------------------------------------------------
drop policy if exists "friend_challenges_update" on public.friend_challenges;

-- Leitura e insert seguem como na Etapa 21:
--   friend_challenges_select  -> participantes + waiting/completed
--   friend_challenges_insert  -> creator_id = auth.uid()
-- (recriadas aqui para garantir consistência caso a migration anterior
--  não tenha sido aplicada exatamente)
drop policy if exists "friend_challenges_select" on public.friend_challenges;
create policy "friend_challenges_select" on public.friend_challenges
  for select using (
    creator_id = auth.uid()
    or opponent_id = auth.uid()
    or status in ('waiting', 'completed')
  );

drop policy if exists "friend_challenges_insert" on public.friend_challenges;
create policy "friend_challenges_insert" on public.friend_challenges
  for insert with check (creator_id = auth.uid());

-- ---------------------------------------------------------------------
-- Função segura para concluir um desafio. SECURITY DEFINER: roda como dona
-- (ignora RLS) mas valida explicitamente o auth.uid() do chamador.
-- ---------------------------------------------------------------------
create or replace function public.complete_friend_challenge(
  p_code text,
  p_opponent_user_squad_id uuid,
  p_match_id uuid,
  p_creator_score int,
  p_opponent_score int,
  p_winner_user_id uuid
)
returns public.friend_challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.friend_challenges;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Não autenticado.';
  end if;

  select * into v_challenge
  from public.friend_challenges
  where code = p_code
  for update;

  if not found then
    raise exception 'Desafio não encontrado.';
  end if;
  if v_challenge.status <> 'waiting' then
    raise exception 'Desafio não está mais aberto.';
  end if;
  if v_challenge.creator_id = v_uid then
    raise exception 'Criador não pode entrar no próprio desafio.';
  end if;
  if v_challenge.opponent_id is not null then
    raise exception 'Desafio já tem oponente.';
  end if;
  if p_winner_user_id is not null
     and p_winner_user_id <> v_challenge.creator_id
     and p_winner_user_id <> v_uid then
    raise exception 'Vencedor inválido.';
  end if;

  update public.friend_challenges set
    opponent_id = v_uid,
    opponent_user_squad_id = p_opponent_user_squad_id,
    match_id = p_match_id,
    creator_score = p_creator_score,
    opponent_score = p_opponent_score,
    winner_user_id = p_winner_user_id,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  where id = v_challenge.id
  returning * into v_challenge;

  return v_challenge;
end;
$$;

grant execute on function public.complete_friend_challenge(
  text, uuid, uuid, int, int, uuid
) to authenticated;
