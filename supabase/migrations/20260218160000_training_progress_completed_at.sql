-- Data/hora em que o usuário concluiu a aula (progress_percent = 100)
alter table public.training_progress
  add column if not exists completed_at timestamptz;
