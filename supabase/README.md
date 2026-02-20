# Supabase

## Migrations

Para criar a tabela `profiles`:

1. **Via Dashboard**: Copie o conteúdo de `migrations/20240216000000_create_profiles.sql` e execute no SQL Editor do Supabase.

2. **Via CLI**: `supabase db push` (com Supabase CLI configurado).

A tabela `profiles` contém: `id`, `nome`, `role`. Novos usuários recebem um perfil automático no signup.
