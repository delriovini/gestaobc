-- Corrige erro "Could not find the 'lesson_id' column" no schema cache.
-- Garantir que training_progress tenha lesson_id e demais colunas usadas pelo código.

alter table public.training_progress
  add column if not exists lesson_id uuid references public.training_lessons(id) on delete cascade;

alter table public.training_progress
  add column if not exists training_id uuid references public.trainings(id) on delete cascade;

alter table public.training_progress
  add column if not exists watched_seconds integer not null default 0;

alter table public.training_progress
  add column if not exists completed boolean not null default false;

alter table public.training_progress
  add column if not exists completed_at timestamptz;

alter table public.training_progress
  add column if not exists updated_at timestamptz default now();

alter table public.training_progress
  add column if not exists created_at timestamptz default now();

alter table public.training_progress
  drop column if exists progress_percent;
