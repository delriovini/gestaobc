-- Eventos de calendário recorrentes (ex.: aniversários)
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data date not null,
  tipo text not null default 'aniversario',
  recorrente_anual boolean default true,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.calendar_events
  add constraint calendar_events_user_id_tipo_key unique (user_id, tipo);

alter table public.calendar_events enable row level security;

create policy "Authenticated can select calendar_events"
  on public.calendar_events for select to authenticated
  using (true);

create policy "Users can insert own calendar_events"
  on public.calendar_events for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own calendar_events"
  on public.calendar_events for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own calendar_events"
  on public.calendar_events for delete to authenticated
  using (auth.uid() = user_id);
