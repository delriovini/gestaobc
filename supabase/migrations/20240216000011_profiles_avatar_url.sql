-- Adiciona coluna avatar_url em profiles
alter table public.profiles add column if not exists avatar_url text;
