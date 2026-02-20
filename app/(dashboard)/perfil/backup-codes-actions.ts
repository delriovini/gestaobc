"use server";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { ensureActiveUser } from "@/lib/ensure-active-user";

export async function saveBackupCodeHashes(hashes: string[]) {
  if (!hashes.length || hashes.length > 16) {
    return { error: "Quantidade inválida de códigos." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  await ensureActiveUser(supabase, user.id);

  const { error: deleteError } = await supabase
    .from("backup_codes")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) return { error: deleteError.message };

  const rows = hashes.map((code_hash) => ({
    user_id: user.id,
    code_hash,
  }));

  const { error: insertError } = await supabase.from("backup_codes").insert(rows);

  if (insertError) return { error: insertError.message };

  return { success: true };
}
