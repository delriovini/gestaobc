"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { ensureActiveUser } from "@/lib/ensure-active-user";
import { normalizeRole, ROLES } from "@/lib/rbac";

export async function closeGamificationMonth(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  await ensureActiveUser(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);
  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    throw new Error("Apenas CEO ou GESTOR podem fechar o mês.");
  }

  const rawReferenceMonth = (formData.get("reference_month") as string | null) ?? "";
  const mesParam = (formData.get("mes") as string | null) ?? "";

  let reference_month: string;
  if (/^\d{4}-\d{2}$/.test(rawReferenceMonth)) {
    reference_month = `${rawReferenceMonth}-01`;
  } else {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    reference_month = `${now.getFullYear()}-${m}-01`;
  }

  const { data: existing, error: existingError } = await supabase
    .from("gamification_months")
    .select("reference_month, status")
    .eq("reference_month", reference_month)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Erro ao buscar controle do mês: ${existingError.message}`);
  }

  if (existing && existing.status === "CLOSED") {
    // Já fechado, apenas volta para a página
    revalidatePath("/dashboard/gamificacao");
    redirect(`/dashboard/gamificacao${mesParam ? `?mes=${mesParam}` : ""}`);
  }

  const payload = {
    reference_month,
    status: "CLOSED" as const,
    closed_at: new Date().toISOString(),
    closed_by: user.id,
  };

  if (existing) {
    const { error } = await supabase
      .from("gamification_months")
      .update(payload)
      .eq("reference_month", reference_month);
    if (error) {
      throw new Error(`Erro ao fechar mês: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("gamification_months").insert(payload);
    if (error) {
      throw new Error(`Erro ao fechar mês: ${error.message}`);
    }
  }

  revalidatePath("/dashboard/gamificacao");
  redirect(`/dashboard/gamificacao${mesParam ? `?mes=${mesParam}` : ""}`);
}

