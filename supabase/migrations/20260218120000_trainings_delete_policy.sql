-- Permite CEO e GESTOR excluírem treinamentos
drop policy if exists "Treinamentos delete" on public.trainings;

create policy "Treinamentos delete"
on public.trainings
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
