import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de Server Component - middleware trata a sessão
          }
        },
      },
    }
  );
}

/**
 * Cliente com service role: ignora RLS. Usar apenas no servidor e apenas para
 * operações confiáveis (ex.: ler status do perfil do usuário logado).
 * Retorna null se SUPABASE_SERVICE_ROLE_KEY não estiver definida.
 */
export function createServerSupabaseAdminClient(): ReturnType<
  typeof createSupabaseClient
> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}
