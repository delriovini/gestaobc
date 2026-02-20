-- Tabela de auditoria para ações como aprovação de usuários
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  performed_by uuid not null references auth.users(id) on delete set null,
  target_user uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Apenas CEO/GESTOR podem inserir (via função) e ler logs
create policy "CEO e Gestor podem ver audit_logs"
  on public.audit_logs for select to authenticated
  using (public.current_user_is_ceo_or_gestor());

-- Função que aprova usuário e registra em audit_logs na mesma transação
create or replace function public.approve_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set status = 'APROVADO'
  where id = p_target_user_id;

  insert into public.audit_logs (action, performed_by, target_user)
  values ('APPROVE_USER', auth.uid(), p_target_user_id);
end;
$$;

-- Permissão para authenticated chamar a função (a checagem de CEO/GESTOR fica na app)
grant execute on function public.approve_user(uuid) to authenticated;
