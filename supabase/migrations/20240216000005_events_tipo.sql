-- Adiciona coluna tipo na tabela events
alter table public.events add column if not exists tipo text;
