-- Tabela events para calendário
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

-- SELECT: usuários veem apenas próprios eventos
create policy "Usuários podem ver próprios eventos"
  on public.events for select to authenticated
  using (auth.uid() = created_by);

-- INSERT
create policy "Usuários podem criar eventos"
  on public.events for insert to authenticated
  with check (auth.uid() = created_by);

-- UPDATE
create policy "Usuários podem atualizar próprios eventos"
  on public.events for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- DELETE
create policy "Usuários podem deletar próprios eventos"
  on public.events for delete to authenticated
  using (auth.uid() = created_by);
