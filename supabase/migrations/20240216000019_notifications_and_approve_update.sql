-- Tabela de notificações para usuários (ex.: cadastro aprovado)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Usuário vê apenas suas próprias notificações
create policy "Usuário vê próprias notificações"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

-- Inserção feita pela função approve_user (SECURITY DEFINER bypassa RLS)

-- Função approve_user atualizada: após audit_logs, insere em notifications
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

  insert into public.notifications (user_id, title, message)
  values (
    p_target_user_id,
    'Cadastro aprovado',
    'Seu acesso ao sistema foi liberado. Faça login novamente.'
  );
end;
$$;
