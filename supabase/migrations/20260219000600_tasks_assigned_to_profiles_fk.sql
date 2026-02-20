-- FK tasks.assigned_to → profiles.id para permitir JOIN no select das tarefas (Kanban).
-- Sem esta FK o Supabase não expõe a relação profiles:assigned_to e o select com join falha.
alter table public.tasks
  drop constraint if exists tasks_assigned_to_profiles_fk;

alter table public.tasks
  drop constraint if exists tasks_assigned_to_fkey;

alter table public.tasks
  add constraint tasks_assigned_to_profiles_fk
  foreign key (assigned_to) references public.profiles(id) on delete set null;
