-- Tabela de receitas (cartão e PIX)
create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  tipo text not null check (tipo in ('cartao', 'pix')),
  data date not null default current_date,
  descricao text,
  created_at timestamptz default now()
);

-- Tabela de despesas
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  valor numeric(12, 2) not null check (valor >= 0),
  data date not null default current_date,
  descricao text,
  created_at timestamptz default now()
);

alter table public.receitas enable row level security;
alter table public.despesas enable row level security;

-- Apenas CEO pode ver/inserir/atualizar/deletar receitas e despesas
create policy "CEO pode gerenciar receitas"
  on public.receitas for all to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  );

create policy "CEO pode gerenciar despesas"
  on public.despesas for all to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'CEO'
  );

-- Índices para filtro por mês
create index if not exists idx_receitas_data on public.receitas (data);
create index if not exists idx_receitas_tipo on public.receitas (tipo);
create index if not exists idx_despesas_data on public.despesas (data);
