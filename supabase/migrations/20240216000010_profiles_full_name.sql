-- Adiciona coluna full_name em profiles (cópia de nome)
alter table public.profiles add column if not exists full_name text;
update public.profiles set full_name = coalesce(nome, '') where full_name is null;
