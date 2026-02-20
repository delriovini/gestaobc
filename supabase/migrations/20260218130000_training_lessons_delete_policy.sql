-- Permite CEO e GESTOR excluírem aulas (training_lessons)
drop policy if exists "Training lessons delete" on public.training_lessons;

create policy "Training lessons delete"
on public.training_lessons
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO','GESTOR')
  )
);
