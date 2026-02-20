-- Coluna de imagem de capa do treinamento
alter table public.trainings add column if not exists cover_image_url text;

-- Bucket para capas de treinamentos
insert into storage.buckets (id, name, public)
values ('training-covers', 'training-covers', true)
on conflict (id) do nothing;

-- Políticas: autenticados (CEO/GESTOR na app) fazem upload
create policy "Autenticados podem fazer upload em training-covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'training-covers');

create policy "Leitura pública em training-covers"
on storage.objects for select
to public
using (bucket_id = 'training-covers');

create policy "Autenticados podem atualizar em training-covers"
on storage.objects for update
to authenticated
using (bucket_id = 'training-covers');

create policy "Autenticados podem deletar em training-covers"
on storage.objects for delete
to authenticated
using (bucket_id = 'training-covers');
