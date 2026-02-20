-- Missões mensais de gamificação (missão do mês)
create table if not exists public.gamification_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  bonus_points integer not null default 0,
  month integer not null,
  year integer not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_gamification_missions_month_year_active
  on public.gamification_missions (year, month, is_active);

alter table public.gamification_missions enable row level security;

-- Usuários autenticados podem ler missões
create policy "gamification_missions select authenticated"
  on public.gamification_missions for select to authenticated
  using (true);

comment on table public.gamification_missions is 'Missão do mês ativa para exibir na página de gamificação.';
