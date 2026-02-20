-- Corrige recursão infinita na policy "CEO e Gestor podem ver todos os perfis".
-- A policy antiga fazia SELECT em profiles para checar o role, disparando a mesma policy de novo.
-- Solução: função SECURITY DEFINER que lê o role sem passar pelo RLS.

create or replace function public.current_user_is_ceo_or_gestor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and upper(trim(role::text)) in ('CEO', 'GESTOR')
  );
$$;

drop policy if exists "CEO e Gestor podem ver todos os perfis" on public.profiles;

create policy "CEO e Gestor podem ver todos os perfis"
  on public.profiles for select to authenticated
  using (public.current_user_is_ceo_or_gestor());
