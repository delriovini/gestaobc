-- Prazo opcional por treinamento (para exibir "X com prazo esta semana" no dashboard).
alter table public.trainings
  add column if not exists due_date date;
