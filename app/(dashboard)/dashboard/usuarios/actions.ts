"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureActiveUser } from "@/lib/ensure-active-user";

export async function updateUserStatus(userId: string, newStatus: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Acesso não autorizado.");
  await ensureActiveUser(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/usuarios");
}

export async function toggleUserStatusForm(formData: FormData) {
  const userId = formData.get("userId") as string | null;
  const currentStatus = formData.get("currentStatus") as string | null;
  if (!userId) return;
  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await updateUserStatus(userId, newStatus);
}
