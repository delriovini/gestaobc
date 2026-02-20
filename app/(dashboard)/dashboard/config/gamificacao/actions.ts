"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeRole, ROLES } from "@/lib/rbac";

function requireCeoOrGestor(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  return async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = normalizeRole(profile?.role ?? null);
    if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
      throw new Error("Sem permissão");
    }
  };
}

export async function createRule(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const name = (formData.get("name") as string)?.trim();
  const rawPoints = Number(formData.get("points"));
  const type = formData.get("type") as string | null;

  if (!name) return;
  if (Number.isNaN(rawPoints)) {
    throw new Error("Pontos inválidos. Informe um número.");
  }

  if (type !== "positive" && type !== "negative") {
    throw new Error('Tipo da regra deve ser "Ganha Pontos" ou "Perde Pontos".');
  }

  const points =
    type === "negative" ? -Math.abs(rawPoints) : Math.abs(rawPoints);

  const { error } = await supabase.from("gamification_rules").insert({
    name,
    points,
    type: type as "positive" | "negative",
    is_active: true,
  });

  if (error) {
    console.error("[createRule] Erro ao inserir regra:", error.message);
    throw new Error(`Falha ao criar regra: ${error.message}`);
  }

  revalidatePath("/dashboard/config", "page");
  redirect("/dashboard/config?tab=gamificacao");
}

export async function updateRulePoints(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  const pointsRaw = formData.get("points") as string;
  if (!id) return;
  const points = Number(pointsRaw);
  if (Number.isNaN(points)) return;

  await supabase.from("gamification_rules").update({ points }).eq("id", id);
  revalidatePath("/dashboard/config");
}

export async function toggleRuleActive(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  const is_active = formData.get("is_active") === "true";
  if (!id) return;

  await supabase.from("gamification_rules").update({ is_active }).eq("id", id);
  revalidatePath("/dashboard/config");
}

export async function deleteRule(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  if (!id) return;

  await supabase.from("gamification_rules").delete().eq("id", id);
  revalidatePath("/dashboard/config");
}

export async function deletePointsLog(id: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase
    .from("gamification_points")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Lançamento não encontrado ou sem permissão para excluir."
    );
  }

  revalidatePath("/dashboard/config?tab=gamificacao");
}

export async function createPointsLog(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const user_id = (formData.get("user_id") as string)?.trim();
  const rule_id = (formData.get("rule_id") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);

  if (!user_id || !rule_id) {
    throw new Error("Usuário e regra são obrigatórios.");
  }

  const { data: rule, error: ruleError } = await supabase
    .from("gamification_rules")
    .select("id, points, is_active")
    .eq("id", rule_id)
    .maybeSingle();

  if (ruleError) {
    throw new Error(`Erro ao buscar regra: ${ruleError.message}`);
  }
  if (!rule) {
    throw new Error("Regra não encontrada.");
  }
  if (!rule.is_active) {
    throw new Error("Regra inativa. Ative a regra para lançar pontos.");
  }

  const totalPoints = rule.points * quantity;

  const { error: insertError } = await supabase.from("gamification_points").insert({
    user_id,
    rule_id: rule.id,
    points: totalPoints,
    description,
  });

  if (insertError) {
    throw new Error(`Falha ao lançar pontos: ${insertError.message}`);
  }

  revalidatePath("/dashboard/config", "page");
  redirect("/dashboard/config?tab=gamificacao");
}

export async function createMission(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const bonus_points = Number(formData.get("bonus_points"));

  if (!title) {
    throw new Error("Título da missão é obrigatório.");
  }
  if (!description) {
    throw new Error("Descrição da missão é obrigatória.");
  }
  if (Number.isNaN(bonus_points)) {
    throw new Error("Bônus de pontos inválido.");
  }

  await supabase
    .from("gamification_missions")
    .update({ is_active: false })
    .eq("month", month)
    .eq("year", year);

  const { error: insertError } = await supabase.from("gamification_missions").insert({
    title,
    description,
    bonus_points,
    month,
    year,
    is_active: true,
  });

  if (insertError) {
    throw new Error(`Falha ao criar missão: ${insertError.message}`);
  }

  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/gamificacao");
}

export async function updateMission(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const bonus_points = Number(formData.get("bonus_points"));
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  if (!id || !title) throw new Error("ID e título são obrigatórios.");
  if (!description) throw new Error("Descrição da missão é obrigatória.");
  if (Number.isNaN(bonus_points) || Number.isNaN(month) || Number.isNaN(year)) {
    throw new Error("Bônus, mês e ano devem ser números válidos.");
  }

  const { data: existing } = await supabase
    .from("gamification_missions")
    .select("month, year")
    .eq("id", id)
    .single();

  if (existing && (existing.month !== month || existing.year !== year)) {
    await supabase
      .from("gamification_missions")
      .update({ is_active: false })
      .eq("month", month)
      .eq("year", year);
  }

  await supabase
    .from("gamification_missions")
    .update({ title, description, bonus_points, month, year, is_active: true })
    .eq("id", id);

  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/gamificacao");
}

export async function toggleMission(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID da missão não informado.");

  const { data: mission } = await supabase
    .from("gamification_missions")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!mission) throw new Error("Missão não encontrada.");

  const { error } = await supabase
    .from("gamification_missions")
    .update({ is_active: !mission.is_active })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/gamificacao");
}

export async function deleteMission(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  await requireCeoOrGestor(supabase)();

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID da missão não informado.");

  const { error } = await supabase.from("gamification_missions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/gamificacao");
}
