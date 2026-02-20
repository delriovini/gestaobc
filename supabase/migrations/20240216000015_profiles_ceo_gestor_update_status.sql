-- CEO e GESTOR podem atualizar status de qualquer perfil (aprovar/rejeitar cadastros)
create policy "CEO e GESTOR podem atualizar status de perfis"
  on public.profiles for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
    )
  );
