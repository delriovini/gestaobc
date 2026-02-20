create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  vimeo_id text not null,
  duration_seconds integer not null,
  is_required boolean default false,
  created_at timestamp with time zone default now()
);

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
  (auth.jwt() ->> 'user_role') in ('CEO','GESTOR')
);

