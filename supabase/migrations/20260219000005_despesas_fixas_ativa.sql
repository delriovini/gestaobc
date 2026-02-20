-- Coluna ativa em despesas_fixas (apenas fixas ativas entram no lançamento automático)
alter table public.despesas_fixas
  add column if not exists ativa boolean not null default true;

create index if not exists idx_despesas_fixas_ativa on public.despesas_fixas (ativa) where ativa = true;
