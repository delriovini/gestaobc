-- Log de tentativas de verificação MFA (sucesso/falha)
create table if not exists public.mfa_attempt_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  success boolean not null,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists mfa_attempt_logs_user_id_idx on public.mfa_attempt_logs(user_id);
create index if not exists mfa_attempt_logs_created_at_idx on public.mfa_attempt_logs(created_at);

alter table public.mfa_attempt_logs enable row level security;

-- Apenas CEO/GESTOR podem ler logs (para auditoria)
create policy "CEO e Gestor podem ver mfa_attempt_logs"
  on public.mfa_attempt_logs for select to authenticated
  using (public.current_user_is_ceo_or_gestor());

-- Sistema (server) insere via service role ou policy que permite insert para o próprio user_id
create policy "Inserir log de tentativa MFA"
  on public.mfa_attempt_logs for insert to authenticated
  with check (auth.uid() = user_id);
