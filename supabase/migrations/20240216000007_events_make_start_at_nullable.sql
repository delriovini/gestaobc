-- Tornar start_at e end_at opcionais (uso principal: event_date, start_time, end_time)
alter table public.events alter column start_at drop not null;
