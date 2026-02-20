-- Regras de gamificação (nome, pontos, tipo) e policies para CEO/GESTOR

create table if not exists public.gamification_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points integer not null,
  type text not null default 'bonus' check (type in ('bonus', 'penalty', 'neutral')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.gamification_rules enable row level security;

-- CEO e GESTOR podem gerenciar regras
create policy "gamification_rules select authenticated"
  on public.gamification_rules for select to authenticated using (true);

create policy "gamification_rules insert ceo_gestor"
  on public.gamification_rules for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR'))
  );

create policy "gamification_rules update ceo_gestor"
  on public.gamification_rules for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')));

create policy "gamification_rules delete ceo_gestor"
  on public.gamification_rules for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')));

-- CEO/GESTOR podem inserir em gamification_logs (lançar pontos)
create policy "gamification_logs insert ceo_gestor"
  on public.gamification_logs for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR'))
  );

-- CEO/GESTOR podem gerenciar missões
create policy "gamification_missions insert ceo_gestor"
  on public.gamification_missions for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR'))
  );

create policy "gamification_missions update ceo_gestor"
  on public.gamification_missions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')));

create policy "gamification_missions delete ceo_gestor"
  on public.gamification_missions for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO','GESTOR')));
