-- Adiciona event_date e start_time na tabela events
alter table public.events add column if not exists event_date date;
alter table public.events add column if not exists start_time time;
alter table public.events add column if not exists end_time time;

-- Backfill a partir de start_at para registros existentes
update public.events
set
  event_date = (start_at at time zone 'UTC')::date,
  start_time = (start_at at time zone 'UTC')::time,
  end_time = case when end_at is not null then (end_at at time zone 'UTC')::time else null end
where event_date is null and start_at is not null;
