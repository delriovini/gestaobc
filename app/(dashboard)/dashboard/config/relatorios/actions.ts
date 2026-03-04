"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";

export type RelatorioStaffInput = {
  staff_id: string;
  tickets_geral?: number | null;
  tickets_security?: number | null;
  tickets_otimizacao?: number | null;
  allowlists?: number | null;
  horas_conectadas?: number | null;
  denuncias?: number | null;
};

export async function upsertRelatoriosStaff(ano: number, mes: number, rows: RelatorioStaffInput[]) {
  await requireRole(ROLES.GESTOR);
  const supabase = await createClient();

  for (const row of rows) {
    // 1) Busca o registro atual (se existir) para este ano/mês/staff
    const { data: existing, error: selectError } = await supabase
      .from("relatorios_staff")
      .select(
        "id, tickets_geral, tickets_security, tickets_otimizacao, allowlists, horas_conectadas, denuncias"
      )
      .eq("ano", ano)
      .eq("mes", mes)
      .eq("staff_id", row.staff_id)
      .maybeSingle();

    if (selectError) {
      return { error: selectError.message };
    }

    // 2) Monta o payload mesclando valores existentes com novos valores informados
    const base = existing ?? {};
    const updatePayload: Partial<RelatorioStaffInput> = {};

    const setIfChanged = (field: keyof RelatorioStaffInput) => {
      const newValue = row[field];
      if (newValue == null) return; // campo não enviado no "formulário" → não mexe
      const currentValue = (base as any)[field] as number | null | undefined;
      if (currentValue === newValue) return; // sem alteração
      (updatePayload as any)[field] = newValue;
    };

    setIfChanged("tickets_geral");
    setIfChanged("tickets_security");
    setIfChanged("tickets_otimizacao");
    setIfChanged("allowlists");
    setIfChanged("horas_conectadas");
    setIfChanged("denuncias");

    // Se nada mudou, segue para a próxima linha
    if (Object.keys(updatePayload).length === 0 && existing) {
      continue;
    }

    if (!existing) {
      // 3a) Não existe ainda: insere um novo registro com os campos informados
      const insertPayload = {
        ano,
        mes,
        staff_id: row.staff_id,
        ...updatePayload,
      };
      const { error: insertError } = await supabase.from("relatorios_staff").insert(insertPayload);
      if (insertError) return { error: insertError.message };
    } else {
      // 3b) Já existe: atualiza apenas os campos alterados
      const { error: updateError } = await supabase
        .from("relatorios_staff")
        .update(updatePayload)
        .eq("id", (existing as any).id);
      if (updateError) return { error: updateError.message };
    }
  }
  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/relatorios");
  return {};
}

export async function fecharMes(ano: number, mes: number) {
  await requireRole(ROLES.GESTOR);
  const supabase = await createClient();
  const { error } = await supabase
    .from("relatorios_staff")
    .update({ fechado: true })
    .eq("ano", ano)
    .eq("mes", mes);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/relatorios");
  return {};
}

// ----------------------
// Configurações de Relatórios (tabela config_relatorios)
// ----------------------

// Linha da tabela config_relatorios para metas de relatórios.
// Mantemos os campos flexíveis, mas já incluímos os exemplos principais.
export type ConfigRelatorios = {
  id?: string;
  tickets_geral_meta?: number | null;
  tickets_security_meta?: number | null;
  tickets_otimizacao_meta?: number | null;
  allowlists_meta?: number | null;
  horas_conectadas_meta?: number | null;
  denuncias_meta?: number | null;
  [key: string]: unknown;
};

// Campos válidos de metas na tabela config_relatorios
export type ConfigRelatoriosFields =
  | "tickets_geral_meta"
  | "tickets_security_meta"
  | "tickets_otimizacao_meta"
  | "allowlists_meta"
  | "horas_conectadas_meta"
  | "denuncias_meta";

/**
 * Carrega a configuração de relatórios da tabela config_relatorios.
 *
 * Implementação conforme solicitado:
 *
 * supabase
 *   .from("config_relatorios")
 *   .select("*")
 *   .single()
 */
export async function getConfigRelatorios() {
  await requireRole(ROLES.GESTOR);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("config_relatorios")
    .select("*")
    .single();

  // Se não houver linha ainda, tratamos como "sem configuração"
  if (error && !data) {
    return { data: null as ConfigRelatorios | null, error: error.message };
  }

  return { data: (data as ConfigRelatorios | null) };
}

/**
 * Salva configurações em config_relatorios mesclando dados existentes com novos valores.
 *
 * Fluxo:
 *  - Buscar configuração atual em config_relatorios
 *  - Mesclar valores existentes com os novos (sem zerar campos não enviados)
 *  - Atualizar usando upsert
 */
export async function salvarConfigRelatorios(data: Partial<ConfigRelatorios>) {
  await requireRole(ROLES.GESTOR);
  const supabase = await createClient();

  // 1) Busca configuração atual
  const { data: existing, error: selectError } = await supabase
    .from("config_relatorios")
    .select("*")
    .single();

  if (selectError && !existing) {
    // Se for erro por não existir linha ainda, seguimos com existing = null
  } else if (selectError) {
    return { error: selectError.message };
  }

  // 2) Calcula apenas os campos que realmente mudaram,
  //    garantindo que campos não enviados não sejam zerados.
  const changedFields: Partial<ConfigRelatorios> = {};

  const setIfChanged = (field: ConfigRelatoriosFields) => {
    const newValue = data[field];
    if (newValue === undefined) return; // campo não enviado → não mexe
    const currentValue = existing ? (existing as any)[field] : undefined;
    if (currentValue === newValue) return; // sem alteração
    changedFields[field] = newValue;
  };

  setIfChanged("tickets_geral_meta");
  setIfChanged("tickets_security_meta");
  setIfChanged("tickets_otimizacao_meta");
  setIfChanged("allowlists_meta");
  setIfChanged("horas_conectadas_meta");
  setIfChanged("denuncias_meta");

  // Se nada mudou e não há registro existente, não há o que salvar
  if (!existing && Object.keys(changedFields).length === 0) {
    return {};
  }

  // 3) Mescla o registro existente (se houver) com os campos alterados
  const payload: ConfigRelatorios = {
    ...(existing as any),
    ...changedFields,
  };

  // 4) Upsert na tabela config_relatorios
  const { error: upsertError } = await supabase
    .from("config_relatorios")
    .upsert(payload);

  if (upsertError) return { error: upsertError.message };

  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/relatorios");
  return {};
}
