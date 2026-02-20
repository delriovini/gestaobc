-- Relatórios por ano/mês (sem cadastro de período)
-- Adiciona ano, mes, fechado em relatorios_staff e unique (ano, mes, staff_id)

alter table public.relatorios_staff
  add column if not exists ano integer,
  add column if not exists mes integer,
  add column if not exists fechado boolean default false;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'relatorios_staff' and column_name = 'periodo_id'
  ) then
    update public.relatorios_staff r
    set
      ano = extract(year from p.data_inicio)::int,
      mes = extract(month from p.data_inicio)::int
    from public.periodos_relatorio p
    where r.periodo_id = p.id and (r.ano is null or r.mes is null);
  end if;

  update public.relatorios_staff
  set ano = extract(year from current_date)::int, mes = extract(month from current_date)::int
  where ano is null or mes is null;
end $$;

alter table public.relatorios_staff alter column ano set default extract(year from current_date)::int;
alter table public.relatorios_staff alter column mes set default extract(month from current_date)::int;
alter table public.relatorios_staff alter column fechado set default false;

alter table public.relatorios_staff alter column ano set not null;
alter table public.relatorios_staff alter column mes set not null;
alter table public.relatorios_staff alter column fechado set not null;

create unique index if not exists relatorios_staff_ano_mes_staff_id_key
  on public.relatorios_staff (ano, mes, staff_id);

create index if not exists idx_relatorios_staff_ano_mes
  on public.relatorios_staff (ano, mes);
