-- Bloqueio temporário após 5 tentativas MFA inválidas
alter table public.profiles add column if not exists mfa_locked_until timestamptz;
alter table public.profiles add column if not exists mfa_failed_attempts int not null default 0;
