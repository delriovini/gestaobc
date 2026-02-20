-- Progresso do usuário por aula (uma linha por user_id + lesson_id)
create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  progress_percent integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);

alter table public.training_progress enable row level security;

-- Usuário autenticado vê e gerencia apenas o próprio progresso
create policy "training_progress select own"
on public.training_progress for select
to authenticated
using (auth.uid() = user_id);

create policy "training_progress insert own"
on public.training_progress for insert
to authenticated
with check (auth.uid() = user_id);

create policy "training_progress update own"
on public.training_progress for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "training_progress delete own"
on public.training_progress for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.training_progress is 'Progresso de conclusão por usuário e aula (0-100%).';
