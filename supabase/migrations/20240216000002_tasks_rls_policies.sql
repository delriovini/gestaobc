-- Políticas RLS completas para a tabela tasks

alter table if exists public.tasks enable row level security;

-- SELECT
drop policy if exists "CEO e Gestor podem ver todas as tarefas" on public.tasks;
drop policy if exists "Usuários podem ver próprias tarefas" on public.tasks;

create policy "CEO e Gestor podem ver todas as tarefas"
  on public.tasks for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and upper(profiles.role::text) in ('CEO', 'GESTOR')
    )
  );

create policy "Usuários podem ver próprias tarefas"
  on public.tasks for select to authenticated
  using (auth.uid() = created_by);

-- INSERT
drop policy if exists "Usuários autenticados podem criar tarefas" on public.tasks;

create policy "Usuários autenticados podem criar tarefas"
  on public.tasks for insert to authenticated
  with check (auth.uid() = created_by);

-- UPDATE
drop policy if exists "Usuários podem atualizar próprias tarefas" on public.tasks;
drop policy if exists "CEO e Gestor podem atualizar qualquer tarefa" on public.tasks;

create policy "Usuários podem atualizar próprias tarefas"
  on public.tasks for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "CEO e Gestor podem atualizar qualquer tarefa"
  on public.tasks for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and upper(profiles.role::text) in ('CEO', 'GESTOR')
    )
  )
  with check (true);

-- DELETE
drop policy if exists "Usuários podem deletar próprias tarefas" on public.tasks;
drop policy if exists "CEO e Gestor podem deletar qualquer tarefa" on public.tasks;

create policy "Usuários podem deletar próprias tarefas"
  on public.tasks for delete to authenticated
  using (auth.uid() = created_by);

create policy "CEO e Gestor podem deletar qualquer tarefa"
  on public.tasks for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and upper(profiles.role::text) in ('CEO', 'GESTOR')
    )
  );
