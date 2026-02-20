-- Novos campos em receitas
alter table public.receitas
  add column if not exists source text;

-- Novos campos em despesas
alter table public.despesas
  add column if not exists category text,
  add column if not exists is_fixed boolean default false,
  add column if not exists affects_reserve boolean default false;
