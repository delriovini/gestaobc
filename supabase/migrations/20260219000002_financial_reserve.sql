-- Reserva financeira por mês (saldo inicial + cartão - despesas que afetam reserva)
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
  using (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  );

create index if not exists idx_financial_reserve_month on public.financial_reserve (month);
