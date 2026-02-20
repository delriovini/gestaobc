-- Permite ver perfil de quem é responsável (assigned_to) em tarefas que o usuário pode ver.
-- Assim o nome do responsável aparece no Kanban mesmo para STAFF (tarefas criadas por ele).
create policy "Ver perfil de responsável de tarefa visível"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.assigned_to = profiles.id
      and (
        t.created_by = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
        )
      )
    )
  );
