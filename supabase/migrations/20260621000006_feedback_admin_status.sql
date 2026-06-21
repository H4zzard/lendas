-- =====================================================================
-- Lendas — Etapa 18: gestão de feedbacks no admin
-- Aplicar DEPOIS das migrations anteriores. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Colunas de gestão
-- ---------------------------------------------------------------------
alter table public.feedback_reports
  add column if not exists status text not null default 'new';
alter table public.feedback_reports
  add column if not exists priority text not null default 'normal';
alter table public.feedback_reports
  add column if not exists admin_note text;
alter table public.feedback_reports
  add column if not exists resolved_at timestamptz;
alter table public.feedback_reports
  add column if not exists resolved_by uuid references auth.users(id) on delete set null;

create index if not exists feedback_reports_status_idx
  on public.feedback_reports(status);
create index if not exists feedback_reports_priority_idx
  on public.feedback_reports(priority);
create index if not exists feedback_reports_created_at_idx
  on public.feedback_reports(created_at);

-- ---------------------------------------------------------------------
-- RLS
-- usuários comuns: inserem e leem só os próprios (já existente na Etapa 16)
-- admins: leem todos (Etapa 17) e podem atualizar todos (abaixo)
-- ---------------------------------------------------------------------
drop policy if exists "feedback_update_admin" on public.feedback_reports;
create policy "feedback_update_admin" on public.feedback_reports
  for update using (public.is_admin()) with check (public.is_admin());
