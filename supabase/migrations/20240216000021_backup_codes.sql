-- Códigos de recuperação (backup): apenas o hash é armazenado
create table if not exists public.backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists backup_codes_user_id_idx on public.backup_codes(user_id);
create index if not exists backup_codes_user_used_idx on public.backup_codes(user_id, used_at) where used_at is null;

alter table public.backup_codes enable row level security;

create policy "Usuário gerencia próprios backup_codes"
  on public.backup_codes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
