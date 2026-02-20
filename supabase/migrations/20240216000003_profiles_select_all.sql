-- CEO e GESTOR podem listar todos os perfis (para select de responsável)
create policy "CEO e Gestor podem ver todos os perfis"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
    )
  );
