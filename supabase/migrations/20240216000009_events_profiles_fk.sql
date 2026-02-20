-- Adiciona FK de events(created_by) para profiles para permitir join
-- profiles.id = auth.users.id, então os valores são compatíveis
alter table public.events
  drop constraint if exists events_created_by_fkey,
  add constraint events_created_by_profiles_fk
    foreign key (created_by) references public.profiles(id) on delete cascade;
