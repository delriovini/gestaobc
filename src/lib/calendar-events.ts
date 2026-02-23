"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

const TIPO_ANIVERSARIO = "aniversario";

export interface SyncBirthdayInput {
  birth_date: string | null;
  nome_completo: string | null;
  full_name: string | null;
}

/**
 * Cria, atualiza ou remove evento de aniversário em calendar_events.
 * Um registro por usuário (tipo = 'aniversario'); removido se birth_date for null.
 */
export async function syncBirthdayEvent(
  supabase: SupabaseClient,
  userId: string,
  input: SyncBirthdayInput
): Promise<{ error: Error | null }> {
  const { birth_date, nome_completo, full_name } = input;

  if (!birth_date || !String(birth_date).trim()) {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("user_id", userId)
      .eq("tipo", TIPO_ANIVERSARIO);
    return { error: error ? new Error(error.message) : null };
  }

  const dataNorm = String(birth_date).trim();
  const apelido = (full_name && String(full_name).trim()) || "";
  const nomeCompletoOuApelido =
    (nome_completo && String(nome_completo).trim()) || apelido || "Usuário";
  const titulo = `Aniversário - ${apelido || nomeCompletoOuApelido}`;
  const descricao = `Aniversário de ${apelido || nomeCompletoOuApelido}`;

  const { error } = await supabase.from("calendar_events").upsert(
    {
      user_id: userId,
      tipo: TIPO_ANIVERSARIO,
      titulo,
      descricao,
      data: dataNorm,
      recorrente_anual: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tipo", ignoreDuplicates: false }
  );

  if (error) return { error: new Error(error.message) };
  return { error: null };
}
