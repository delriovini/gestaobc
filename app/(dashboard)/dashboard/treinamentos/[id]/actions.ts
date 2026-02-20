"use server";

import { revalidatePath } from "next/cache";
import {
  createServerSupabaseClient,
  createServerSupabaseAdminClient,
} from "@/lib/supabaseServer";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { ensureActiveUser } from "@/lib/ensure-active-user";

export async function addComment(formData: FormData) {
  const training_id = formData.get("training_id") as string | null;
  const content = (formData.get("content") as string | null)?.trim();

  if (!training_id || !content) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await ensureActiveUser(supabase, user.id);

  const { error } = await supabase.from("training_comments").insert({
    training_id,
    user_id: user.id,
    content,
  });

  if (error) {
    console.error("Erro ao inserir comentário:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/treinamentos/${training_id}`);
}

export async function deleteComment(formData: FormData) {
  const comment_id = formData.get("comment_id") as string | null;
  const training_id = formData.get("training_id") as string | null;
  if (!comment_id || !training_id) return;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  await ensureActiveUser(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);

  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    throw new Error("Sem permissão para excluir comentários");
  }

  const admin = createServerSupabaseAdminClient();
  const client = admin ?? supabase;

  const { error } = await client
    .from("training_comments")
    .delete()
    .eq("id", comment_id);

  if (error) {
    console.error("Erro ao excluir comentário:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/treinamentos/${training_id}`);
}
