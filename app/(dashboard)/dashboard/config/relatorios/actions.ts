"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";

export type RelatorioStaffInput = {
  staff_id: string;
  tickets_geral: number;
  tickets_security: number;
  tickets_otimizacao: number;
  allowlists: number;
  horas_conectadas: number;
  denuncias: number;
};

export async function upsertRelatoriosStaff(ano: number, mes: number, rows: RelatorioStaffInput[]) {
  await requireRole(ROLES.GESTOR);
  const supabase = await createClient();

  for (const row of rows) {
    const { error } = await supabase.from("relatorios_staff").upsert(
      {
        ano,
        mes,
        staff_id: row.staff_id,
        tickets_geral: row.tickets_geral,
        tickets_security: row.tickets_security,
        tickets_otimizacao: row.tickets_otimizacao,
        allowlists: row.allowlists,
        horas_conectadas: row.horas_conectadas,
        denuncias: row.denuncias,
      },
      { onConflict: "ano,mes,staff_id" }
    );
    if (error) return { error: error.message };
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
