-- Coluna status em profiles (ex.: PENDENTE, APROVADO para fluxo de aprovação de cadastro)
alter table public.profiles add column if not exists status text default 'PENDENTE';
