"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeRole, ROLES } from "@/lib/rbac";

export async function createTraining(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado ao criar treinamento");
  }

  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const is_required = formData.get("is_required") === "on";
  const coverImageFile = formData.get("cover_image") as File | null;

  if (!title) {
    console.error("Título é obrigatório para criar treinamento");
    return;
  }

  let cover_image_url: string | null = null;

  if (coverImageFile && coverImageFile.size > 0) {
    const fileExt = coverImageFile.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("training-covers")
      .upload(filePath, coverImageFile, {
        contentType: coverImageFile.type || "image/jpeg",
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("training-covers")
        .getPublicUrl(filePath);
      cover_image_url = urlData.publicUrl;
    }
  }

  const { error } = await supabase.from("trainings").insert({
    title,
    description,
    is_required,
    cover_image_url,
    created_by: user.id,
  });

  if (error) {
    console.error("Erro ao criar treinamento:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/treinamentos/admin");
  revalidatePath("/dashboard/config");
}

export async function deleteTraining(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = normalizeRole(profile?.role ?? null);
  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    throw new Error("Sem permissão para excluir treinamentos");
  }

  const { error } = await supabase.from("trainings").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir treinamento:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/treinamentos/admin");
  revalidatePath("/dashboard/config");
}
