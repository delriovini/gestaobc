-- Tabela de lançamentos de pontos (histórico por usuário/regra)
create table if not exists public.gamification_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid not null references public.gamification_rules(id) on delete restrict,
  points integer not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_gamification_points_user_id
  on public.gamification_points (user_id);
create index if not exists idx_gamification_points_created_at
  on public.gamification_points (created_at desc);

alter table public.gamification_points enable row level security;

-- SELECT: autenticados podem ler (para histórico e admin)
drop policy if exists "gamification_points select authenticated" on public.gamification_points;
create policy "gamification_points select authenticated"
  on public.gamification_points for select to authenticated
  using (true);

-- INSERT: CEO/GESTOR
drop policy if exists "gamification_points insert ceo_gestor" on public.gamification_points;
create policy "gamification_points insert ceo_gestor"
  on public.gamification_points for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR'))
  );

-- DELETE: CEO/GESTOR (para excluir lançamento no histórico admin)
drop policy if exists "gamification_points delete ceo_gestor" on public.gamification_points;
create policy "gamification_points delete ceo_gestor"
  on public.gamification_points for delete to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR'))
  );

comment on table public.gamification_points is 'Lançamentos manuais de pontos por regra (histórico por usuário).';
