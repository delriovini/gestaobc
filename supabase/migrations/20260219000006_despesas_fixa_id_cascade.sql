-- Ao deletar despesa_fixa, remove todas as despesas que referenciam (fixa_id)
alter table public.despesas
  drop constraint if exists despesas_fixa_id_fkey;

alter table public.despesas
  add constraint despesas_fixa_id_fkey
  foreign key (fixa_id) references public.despesas_fixas(id) on delete cascade;
