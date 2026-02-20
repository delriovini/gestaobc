-- Garante que get_gamification_ranking retorne total como integer (evita bigint vindo como string/undefined no cliente)

create or replace function public.get_gamification_ranking()
returns table (user_id uuid, total integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    gp.user_id,
    (sum(gp.points))::integer as total
  from public.gamification_points gp
  group by gp.user_id
  order by total desc;
$$;
