-- Garantir que CEO e GESTOR possam listar todos os perfis (idempotente).
-- Se a policy já existir, será recriada; se o banco não tiver a migration 000003, será criada.
-- Resolve: página /dashboard/usuarios mostrando apenas o usuário logado quando o RLS
-- só tinha a policy "Usuários podem ver próprio perfil".

drop policy if exists "CEO e Gestor podem ver todos os perfis" on public.profiles;

create policy "CEO e Gestor podem ver todos os perfis"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
    )
  );
