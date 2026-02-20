-- Cria bucket avatars (se não existir) para upload de fotos de perfil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas para storage.objects no bucket avatars

-- Autenticados podem fazer upload
create policy "Autenticados podem fazer upload em avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars');

-- Leitura pública (bucket é public)
create policy "Leitura pública em avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Autenticados podem atualizar (para upsert) e deletar seus arquivos
create policy "Autenticados podem atualizar em avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars');

create policy "Autenticados podem deletar em avatars"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars');
