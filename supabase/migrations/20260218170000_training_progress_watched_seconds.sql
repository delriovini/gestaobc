-- Substitui progress_percent por watched_seconds + completed
-- Regra: completed = true quando watched_seconds >= duration_seconds da aula

alter table public.training_progress
  add column if not exists training_id uuid references public.trainings(id) on delete cascade,
  add column if not exists watched_seconds integer not null default 0,
  add column if not exists completed boolean not null default false;

alter table public.training_progress
  drop column if exists progress_percent;

-- Backfill training_id a partir da aula
update public.training_progress tp
set training_id = tl.training_id
from public.training_lessons tl
where tp.lesson_id = tl.id
  and tp.training_id is null;

-- Marcar como completed onde já existia completed_at
update public.training_progress
set completed = true
where completed_at is not null;

comment on table public.training_progress is 'Progresso por usuário e aula: watched_seconds, completed, completed_at.';