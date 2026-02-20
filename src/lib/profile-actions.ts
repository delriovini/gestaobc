"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureActiveUser } from "@/lib/ensure-active-user";

const AVATARS_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Usuário não autenticado") };
  }

  await ensureActiveUser(supabase, user.id);

  const nomeCompleto = (formData.get("nome_completo") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const avatarFile = formData.get("avatar") as File | null;

  const updates: { nome_completo?: string | null; full_name?: string | null; avatar_url?: string } = {};

  if (nomeCompleto !== undefined) {
    updates.nome_completo = nomeCompleto || null;
  }
  if (fullName !== undefined) {
    updates.full_name = fullName || null;
  }

  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return { error: new Error("Imagem deve ter no máximo 1MB.") };
    }
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: new Error(uploadError.message) };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(fileName);
    updates.avatar_url = publicUrl;
  }

  if (Object.keys(updates).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { error: null };
}
