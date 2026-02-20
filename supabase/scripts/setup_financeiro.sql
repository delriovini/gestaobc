-- Execute este script no Supabase: SQL Editor → New query → colar e Run
-- Cria tabelas receitas, despesas e financial_reserve para o módulo Financeiro.

-- 1) Tabela de receitas (cartão e PIX)
create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  tipo text not null check (tipo in ('cartao', 'pix')),
  data date not null default current_date,
  descricao text,
  created_at timestamptz default now()
);

-- 2) Tabela de despesas
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  data date not null default current_date,
  descricao text,
  created_at timestamptz default now()
);

alter table public.receitas enable row level security;
alter table public.despesas enable row level security;

create policy "CEO pode gerenciar receitas"
  on public.receitas for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

create policy "CEO pode gerenciar despesas"
  on public.despesas for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

create index if not exists idx_receitas_data on public.receitas (data);
create index if not exists idx_receitas_tipo on public.receitas (tipo);
create index if not exists idx_despesas_data on public.despesas (data);

-- 3) Campos extras
alter table public.receitas add column if not exists source text;
alter table public.despesas
  add column if not exists category text,
  add column if not exists is_fixed boolean default false,
  add column if not exists affects_reserve boolean default false;

-- 4) Reserva financeira por mês
create table if not exists public.financial_reserve (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,
  starting_balance numeric(14, 2) not null default 0,
  ending_balance numeric(14, 2) not null default 0,
  total_card_revenue numeric(14, 2) not null default 0,
  total_reserve_expenses numeric(14, 2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.financial_reserve enable row level security;

create policy "CEO pode gerenciar financial_reserve"
  on public.financial_reserve for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

create index if not exists idx_financial_reserve_month on public.financial_reserve (month);

-- 5) Fundo financeiro (controle automático por mês: year + month, saldo_inicial + lucro_mes = saldo_final)
create table if not exists public.financial_fund (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month >= 1 and month <= 12),
  saldo_inicial numeric(14, 2) not null default 0,
  receita_cartao numeric(14, 2) not null default 0,
  total_despesas numeric(14, 2) not null default 0,
  lucro_mes numeric(14, 2) not null default 0,
  saldo_final numeric(14, 2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(year, month)
);

alter table public.financial_fund enable row level security;

create policy "CEO pode gerenciar financial_fund"
  on public.financial_fund for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

create index if not exists idx_financial_fund_year_month on public.financial_fund (year, month);

-- 6) Despesas fixas e tipo em despesas
create table if not exists public.despesas_fixas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  descricao text,
  ativa boolean not null default true,
  created_at timestamptz default now()
);
alter table public.despesas_fixas enable row level security;
alter table public.despesas_fixas add column if not exists ativa boolean not null default true;
create policy "CEO pode gerenciar despesas_fixas"
  on public.despesas_fixas for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'CEO')
  with check ((select role from public.profiles where id = auth.uid()) = 'CEO');

alter table public.despesas
  add column if not exists tipo text not null default 'avulsa' check (tipo in ('avulsa', 'fixa')),
  add column if not exists fixa_id uuid references public.despesas_fixas(id) on delete set null;
create index if not exists idx_despesas_tipo on public.despesas (tipo);
create index if not exists idx_despesas_fixa_id on public.despesas (fixa_id);
