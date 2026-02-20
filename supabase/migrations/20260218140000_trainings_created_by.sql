-- Registra quem criou o treinamento
alter table public.trainings
  add column if not exists created_by uuid references auth.users(id) on delete set null;
