-- Comentários por treinamento (lesson)
create table if not exists public.training_comments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_training_comments_training_id
  on public.training_comments(training_id);
create index if not exists idx_training_comments_created_at
  on public.training_comments(created_at desc);

alter table public.training_comments enable row level security;

drop policy if exists "training_comments select" on public.training_comments;
drop policy if exists "training_comments insert" on public.training_comments;

create policy "training_comments select"
on public.training_comments
for select
to authenticated
using (true);

create policy "training_comments insert"
on public.training_comments
for insert
to authenticated
with check (auth.uid() = user_id);
