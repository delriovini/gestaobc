import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garante que o usuário autenticado tem status ACTIVE no perfil.
 * Deve ser chamado em server actions críticas após obter o supabase client.
 * @throws Error "Acesso não autorizado." se não autenticado ou status !== "ACTIVE"
 */
export async function ensureActiveUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .single();

  if (profile?.status !== "ACTIVE") {
    throw new Error("Acesso não autorizado.");
  }
}
