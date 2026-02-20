-- Missão ativa do mês atual (criada neste mês e is_active = true)

create or replace function public.get_current_month_mission()
returns setof public.gamification_missions
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.gamification_missions
  where is_active = true
    and date_trunc('month', created_at) = date_trunc('month', now())
  limit 1;
$$;

comment on function public.get_current_month_mission() is 'Retorna a missão ativa cujo created_at está no mês atual (ou vazio).';
