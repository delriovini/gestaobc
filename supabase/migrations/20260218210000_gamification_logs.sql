-- Log de pontos de gamificação por usuário (regra aplicada, mês/ano)
create table if not exists public.gamification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null,
  rule_name text not null,
  month integer not null,
  year integer not null,
  created_at timestamptz default now()
);

create index if not exists idx_gamification_logs_user_month_year
  on public.gamification_logs (user_id, year, month);

create index if not exists idx_gamification_logs_year_month
  on public.gamification_logs (year, month);

alter table public.gamification_logs enable row level security;

-- Usuários autenticados podem ler todos os logs (para ranking e histórico)
create policy "gamification_logs select authenticated"
  on public.gamification_logs for select to authenticated
  using (true);

-- Inserção/atualização via backend ou service role (esta página é só leitura)
comment on table public.gamification_logs is 'Log de pontos por regra aplicada, usado para ranking e histórico.';
