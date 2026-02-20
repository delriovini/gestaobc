-- Corrige policies de RLS para usar a role do perfil,
-- já que o JWT não possui a claim user_role.

alter table public.trainings enable row level security;

drop policy if exists "Treinamentos select" on public.trainings;
drop policy if exists "Treinamentos insert" on public.trainings;

create policy "Treinamentos select"
on public.trainings
for select
to authenticated
using (true);

create policy "Treinamentos insert"
on public.trainings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO','GESTOR')
  )
);

