-- Nomear a constraint única para training_progress_unique (usado pelo upsert no código)
-- Remove o nome gerado pelo PostgreSQL e adiciona o nome esperado pelo código

alter table public.training_progress
  drop constraint if exists training_progress_user_id_lesson_id_key;

alter table public.training_progress
  drop constraint if exists training_progress_lesson_id_user_id_key;

alter table public.training_progress
  add constraint training_progress_unique unique (user_id, lesson_id);
