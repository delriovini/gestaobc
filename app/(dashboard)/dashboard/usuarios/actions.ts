"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
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

  if (status === "APROVADO") {
    const { error } = await supabase.rpc("approve_user", {
      p_target_user_id: userId,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}
