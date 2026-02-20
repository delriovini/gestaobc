-- Garantir que todo novo usuário seja criado com role STAFF no trigger (não depender só do default da coluna)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'STAFF'
  );
  return new;
end;
$$ language plpgsql security definer;
