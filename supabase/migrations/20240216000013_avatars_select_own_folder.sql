-- Usuário pode fazer select apenas na própria pasta (userId/avatar.jpg)
create policy "Avatar select own folder"
on storage.objects
for select
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
