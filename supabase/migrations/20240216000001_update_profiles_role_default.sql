-- Atualizar default do role para STAFF (RBAC)
-- Roles válidos: CEO, GESTOR, STAFF, USUARIO
alter table public.profiles alter column role set default 'STAFF';
