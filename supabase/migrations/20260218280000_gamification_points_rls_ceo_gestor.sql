-- Corrige RLS de gamification_points: usa current_user_is_ceo_or_gestor() para INSERT e DELETE
-- (evita falha quando role em profiles está em outro case)

drop policy if exists "gamification_points insert ceo_gestor" on public.gamification_points;
create policy "gamification_points insert ceo_gestor"
  on public.gamification_points for insert to authenticated
  with check (public.current_user_is_ceo_or_gestor());

drop policy if exists "gamification_points delete ceo_gestor" on public.gamification_points;
create policy "gamification_points delete ceo_gestor"
  on public.gamification_points for delete to authenticated
  using (public.current_user_is_ceo_or_gestor());
