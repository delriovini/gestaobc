-- Tabela de despesas fixas (modelo mensal)
create table if not exists public.despesas_fixas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  descricao text,
  created_at timestamptz default now()
);

alter table public.despesas_fixas enable row level security;

create policy "CEO pode gerenciar despesas_fixas"
  on public.despesas_fixas for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

-- Campos em despesas: tipo (avulsa | fixa) e referência à fixa
alter table public.despesas
  add column if not exists tipo text not null default 'avulsa' check (tipo in ('avulsa', 'fixa')),
  add column if not exists fixa_id uuid references public.despesas_fixas(id) on delete set null;

create index if not exists idx_despesas_tipo on public.despesas (tipo);
create index if not exists idx_despesas_fixa_id on public.despesas (fixa_id);
