-- Fundo financeiro por mês (controle automático: saldo_inicial + lucro_mes = saldo_final)
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
