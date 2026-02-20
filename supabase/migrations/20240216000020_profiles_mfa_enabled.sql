-- Estado de 2FA no perfil (sincronizado com auth.mfa ao ativar/desativar)
alter table public.profiles add column if not exists mfa_enabled boolean not null default false;
