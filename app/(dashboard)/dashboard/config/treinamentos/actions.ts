"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function deleteTraining(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("trainings").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir treinamento:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/config/treinamentos");
}

export async function updateTraining(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;

  const title = (formData.get("title") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const vimeo_id = (formData.get("vimeo_id") as string | null)?.trim() || null;
  const durationRaw = (formData.get("duration") as string | null)?.trim() || null;
  const is_required = formData.get("is_required") === "on";

  const duration_seconds =
    durationRaw && !Number.isNaN(Number(durationRaw)) ? Number(durationRaw) : null;

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("trainings")
    .update({
      title,
      description,
      vimeo_id,
      duration_seconds,
      is_required,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar treinamento:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/config/treinamentos");
}

