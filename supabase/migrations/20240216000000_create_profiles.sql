-- Execute via Supabase Dashboard (SQL Editor) ou: supabase db push
-- Tabela profiles para armazenar dados extras do usuário
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  role text default 'STAFF',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: usuários podem ler e atualizar apenas seu próprio perfil
alter table public.profiles enable row level security;

create policy "Usuários podem ver próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Função para criar perfil automaticamente no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para novos usuários
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
