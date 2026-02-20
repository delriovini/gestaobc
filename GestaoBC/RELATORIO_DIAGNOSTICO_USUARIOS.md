# Relatório de diagnóstico – Página /dashboard/usuarios

## Problema
A página `/dashboard/usuarios` exibe apenas o usuário logado em vez de listar todos os usuários para perfis CEO/GESTOR.

---

## 1) RLS na tabela `profiles`

**Status:** RLS está habilitado.

- Arquivo: `supabase/migrations/20240216000000_create_profiles.sql`
- Comando: `alter table public.profiles enable row level security;`

---

## 2) Policies ativas da tabela `profiles`

Conforme as migrations do projeto:

| Policy | Operação | Condição (USING) |
|--------|----------|-------------------|
| "Usuários podem ver próprio perfil" | SELECT | `auth.uid() = id` |
| "Usuários podem atualizar próprio perfil" | UPDATE | `auth.uid() = id` |
| "CEO e Gestor podem ver todos os perfis" | SELECT | `exists (select 1 from profiles p where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR'))` |
| "CEO e GESTOR podem atualizar status de perfis" | UPDATE | idem (CEO/GESTOR) |

---

## 3) Policy de SELECT restritiva

- **"Usuários podem ver próprio perfil"** é restritiva: o usuário só vê linhas em que `auth.uid() = id`, ou seja, só o próprio perfil.
- **"CEO e Gestor podem ver todos os perfis"** permite que, quando o usuário logado é CEO ou GESTOR, **todas** as linhas de `profiles` sejam visíveis (a condição não depende do `id` da linha).

No PostgreSQL, com várias policies para o mesmo comando (SELECT), a linha é visível se **qualquer** policy permitir. Portanto, se as duas policies existirem no banco, um usuário CEO/GESTOR deve ver todos os perfis.

**Causa provável do bug:** a migration `20240216000003_profiles_select_all.sql` (que cria a policy "CEO e Gestor podem ver todos os perfis") pode não ter sido aplicada no ambiente em uso. Nesse caso, só a policy restritiva existe e **todos** os usuários (inclusive CEO/GESTOR) passam a ver apenas o próprio perfil.

---

## 4) Uso de `.eq("id", user.id)` em `usuarios/page.tsx`

**Status:** correto, sem filtro indevido para CEO/GESTOR.

- **CEO/GESTOR:** a listagem usa `supabase.from("profiles").select("*").order("full_name", { ascending: true })` — **sem** `.eq("id", user.id)`.
- **STAFF:** usa `supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()` — filtro por id apenas neste caso.

Não há `.eq("id", user.id)` no ramo em que o role é CEO ou GESTOR.

---

## 5) Uso de `createServerClient`

**Status:** uso correto.

- Cliente: `createServerSupabaseClient()` em `lib/supabaseServer.ts` (ou `src/lib/supabaseServer.ts`).
- Implementação: `createServerClient` de `@supabase/ssr` com:
  - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - cookies: `getAll()` e `setAll()` usando `cookies()` do Next.js

Isso garante que as requisições ao Supabase usem a sessão do usuário logado; o RLS usa `auth.uid()` corretamente.

---

## 6) Correções aplicadas

### Migration idempotente para a policy de SELECT (CEO/GESTOR)

Foi criada a migration:

**`supabase/migrations/20240216000016_profiles_select_all_ceo_gestor_idempotent.sql`**

- Remove a policy "CEO e Gestor podem ver todos os perfis" se ela existir (`drop policy if exists`).
- Recria a mesma policy com a condição já usada na migration 000003.

Efeito:
- Se a policy nunca foi aplicada, ela passa a existir após rodar as migrations.
- Se já existia, ela é recriada sem alterar o comportamento.

**Como aplicar**

No projeto:

```bash
supabase db push
```

Ou, no Supabase Dashboard (SQL Editor), executar o conteúdo da migration:

```sql
drop policy if exists "CEO e Gestor podem ver todos os perfis" on public.profiles;

create policy "CEO e Gestor podem ver todos os perfis"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and upper(p.role::text) in ('CEO', 'GESTOR')
    )
  );
```

Nenhuma alteração foi feita em `usuarios/page.tsx` nem em `supabaseServer.ts`, pois estavam corretos.

---

## Resumo

| Item | Resultado |
|------|-----------|
| RLS em `profiles` | Habilitado |
| Policies de SELECT | Uma restritiva (próprio perfil) e uma para CEO/GESTOR (todos os perfis) |
| Causa provável | Policy "CEO e Gestor podem ver todos os perfis" ausente no banco |
| Filtro `.eq("id", user.id)` na página | Apenas no ramo STAFF; correto |
| `createServerClient` | Uso correto |
| Correção | Nova migration idempotente para garantir a policy de SELECT para CEO/GESTOR |

Após aplicar a migration no banco (via `supabase db push` ou SQL no Dashboard), usuários com role CEO ou GESTOR devem passar a ver todos os usuários na página `/dashboard/usuarios`.
