"use server";

import { revalidatePath } from "next/cache";
import {
  createServerSupabaseClient,
  createServerSupabaseAdminClient,
} from "@/lib/supabaseServer";
import { normalizeRole, ROLES, hasPermission } from "@/lib/rbac";

export async function updateUserStatus(
  userId: string,
  status: "APROVADO" | "REJEITADO"
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentRole = normalizeRole(profile?.role ?? null);
  if (!hasPermission(currentRole, ROLES.GESTOR)) {
    return { error: "Sem permissão" };
  }

  const admin = createServerSupabaseAdminClient();
  const client = admin ?? supabase;

  if (status === "APROVADO") {
    const { error: rpcError } = await supabase.rpc("approve_user", {
      p_target_user_id: userId,
    });
    if (rpcError) {
      const { error: updateError } = await client
        .from("profiles")
        .update({ status: "APROVADO" })
        .eq("id", userId);
      if (updateError) return { error: updateError.message };
    }
  } else {
    const { error } = await client
      .from("profiles")
      .update({ status: "REJEITADO" })
      .eq("id", userId);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}
