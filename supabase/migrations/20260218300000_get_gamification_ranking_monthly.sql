-- Ranking mensal: pontos do mês atual, top 5, com nome e avatar via join.
-- Filtro de mês 100% no banco: date_trunc('month', created_at) = date_trunc('month', now())

create or replace function public.get_gamification_ranking()
returns table (
  user_id uuid,
  total_points integer,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gp.user_id,
    (sum(gp.points))::integer as total_points,
    p.full_name,
    p.avatar_url
  from public.gamification_points gp
  join public.profiles p on p.id = gp.user_id
  where date_trunc('month', gp.created_at) = date_trunc('month', now())
  group by gp.user_id, p.full_name, p.avatar_url
  order by total_points desc
  limit 5;
$$;

comment on function public.get_gamification_ranking() is 'Ranking mensal: soma de pontos do mês atual por usuário (top 5), com full_name e avatar_url do profile.';
