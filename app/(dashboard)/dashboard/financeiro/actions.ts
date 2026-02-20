"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { ensureActiveUser } from "@/lib/ensure-active-user";

async function requireCEO() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  await ensureActiveUser(supabase, user.id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = normalizeRole(profile?.role ?? null);
  if (role !== ROLES.CEO) throw new Error("Apenas CEO pode executar esta ação.");
  return supabase;
}

export type ReceitaTipo = "cartao" | "pix";

/**
 * Registra uma receita (insere na tabela receitas).
 * Apenas CEO. Revalida /dashboard/financeiro após inserir.
 */
export async function createReceita(params: {
  valor: number;
  tipo: ReceitaTipo;
  data: string;
  descricao?: string | null;
}) {
  const supabase = await requireCEO();
  const { valor, tipo, data, descricao } = params;

  if (typeof valor !== "number" || valor < 0)
    throw new Error("Valor da receita é obrigatório e deve ser maior ou igual a zero.");
  if (!["cartao", "pix"].includes(tipo))
    throw new Error("Tipo deve ser 'cartao' ou 'pix'.");
  if (!data?.trim())
    throw new Error("Data da receita é obrigatória.");

  const dataNorm = String(data).trim().slice(0, 10);

  const { error } = await supabase.from("receitas").insert({
    valor,
    tipo,
    data: dataNorm,
    descricao: descricao?.trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}

export type DespesaTipo = "avulsa" | "fixa_mensal";

/**
 * Registra uma despesa (insere na tabela despesas e, se fixa_mensal, também em despesas_fixas).
 * Apenas CEO. Revalida /dashboard/financeiro após inserir.
 */
export async function createDespesa(params: {
  valor: number;
  data: string;
  descricao?: string | null;
  tipo?: DespesaTipo | null;
}) {
  const supabase = await requireCEO();
  const { valor, data, descricao, tipo = "avulsa" } = params;

  if (typeof valor !== "number" || valor < 0)
    throw new Error("Valor da despesa é obrigatório e deve ser maior ou igual a zero.");
  if (!data?.trim())
    throw new Error("Data da despesa é obrigatória.");
  const tipoNorm = tipo === "fixa_mensal" ? "fixa_mensal" : "avulsa";

  const dataNorm = String(data).trim().slice(0, 10);
  const desc = descricao?.trim() || null;

  if (tipoNorm === "fixa_mensal") {
    const { data: fixa, error: errFixa } = await supabase
      .from("despesas_fixas")
      .insert({ valor, descricao: desc })
      .select("id")
      .single();
    if (errFixa) throw new Error(errFixa.message);
    const fixaId = (fixa as { id: string }).id;
    const { error: errDespesa } = await supabase.from("despesas").insert({
      valor,
      data: dataNorm,
      descricao: desc,
      tipo: "fixa",
      fixa_id: fixaId,
    });
    if (errDespesa) throw new Error(errDespesa.message);
  } else {
    const { error } = await supabase.from("despesas").insert({
      valor,
      data: dataNorm,
      descricao: desc,
      tipo: "avulsa",
      fixa_id: null,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/financeiro");
}

/**
 * Remove uma receita pelo id. Apenas CEO.
 */
export async function deleteReceita(id: string) {
  if (!id?.trim()) throw new Error("Id é obrigatório.");
  const supabase = await requireCEO();
  const { data, error } = await supabase
    .from("receitas")
    .delete()
    .eq("id", id.trim())
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Registro não encontrado ou sem permissão.");
  revalidatePath("/dashboard/financeiro");
}

/**
 * Remove uma despesa pelo id. Apenas CEO.
 * Se tipo === 'fixa': deleta em despesas_fixas (cascade remove todas as despesas mensais com aquele fixa_id).
 * Se tipo === 'avulsa': deleta apenas aquela linha em despesas.
 */
export async function deleteDespesa(id: string) {
  if (!id?.trim()) throw new Error("Id é obrigatório.");
  const supabase = await requireCEO();
  const rowId = id.trim();

  const { data: row, error: fetchError } = await supabase
    .from("despesas")
    .select("tipo, fixa_id")
    .eq("id", rowId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!row) throw new Error("Registro não encontrado ou sem permissão.");

  const tipo = (row as { tipo?: string; fixa_id?: string | null }).tipo;
  const fixaId = (row as { tipo?: string; fixa_id?: string | null }).fixa_id;

  if (tipo === "fixa" && fixaId) {
    const { error: delFixaError } = await supabase
      .from("despesas_fixas")
      .delete()
      .eq("id", fixaId);
    if (delFixaError) throw new Error(delFixaError.message);
  } else {
    const { data, error } = await supabase
      .from("despesas")
      .delete()
      .eq("id", rowId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("Registro não encontrado ou sem permissão.");
  }

  revalidatePath("/dashboard/financeiro");
}

/** Wrapper para uso em form action: recebe FormData e chama deleteReceita(id). */
export async function deleteReceitaForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Id é obrigatório.");
  await deleteReceita(id.trim());
}

/** Wrapper para uso em form action: recebe FormData e chama deleteDespesa(id). */
export async function deleteDespesaForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) throw new Error("Id é obrigatório.");
  await deleteDespesa(id.trim());
}

export type RevenueType = "card" | "pix";

export async function createRevenue(params: {
  description: string;
  amount: number;
  type: RevenueType;
  source: string;
  revenue_date: string;
}) {
  const supabase = await requireCEO();

  const { description, amount, type, source, revenue_date } = params;

  if (amount < 0) throw new Error("Valor da receita deve ser maior ou igual a zero.");
  if (!["card", "pix"].includes(type)) throw new Error("Tipo deve ser 'card' ou 'pix'.");
  if (!revenue_date?.trim()) throw new Error("Data da receita é obrigatória.");

  const tipo = type === "card" ? "cartao" : "pix";
  const data = revenue_date.trim().slice(0, 10);

  const { error } = await supabase.from("receitas").insert({
    descricao: description?.trim() || null,
    valor: amount,
    tipo,
    source: source?.trim() || null,
    data,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}

export async function createExpense(params: {
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  is_fixed: boolean;
  affects_reserve: boolean;
}) {
  const supabase = await requireCEO();

  const { description, amount, category, expense_date, is_fixed, affects_reserve } = params;

  if (amount < 0) throw new Error("Valor da despesa deve ser maior ou igual a zero.");
  if (!expense_date?.trim()) throw new Error("Data da despesa é obrigatória.");

  const data = expense_date.trim().slice(0, 10);

  const { error } = await supabase.from("despesas").insert({
    descricao: description?.trim() || null,
    valor: amount,
    category: category?.trim() || null,
    data,
    is_fixed: Boolean(is_fixed),
    affects_reserve: Boolean(affects_reserve),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}

export async function deleteRevenue(id: string) {
  const supabase = await requireCEO();
  const { error } = await supabase.from("receitas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}

export async function deleteExpense(id: string) {
  const supabase = await requireCEO();
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}

function getMonthRange(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    monthFirst: start.toISOString().slice(0, 10),
  };
}

/**
 * Atualiza o registro de reserva do mês:
 * - Receita cartão do mês
 * - Despesas do mês com affects_reserve = true
 * - ending_balance = starting_balance + total_card_revenue - total_reserve_expenses
 * starting_balance vem do ending_balance do mês anterior (ou 0).
 */
export async function updateReserveMonth(yearMonth?: string) {
  const supabase = await requireCEO();

  const now = new Date();
  const ym = yearMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end, monthFirst } = getMonthRange(ym);
  const [year, month] = ym.split("-").map(Number);

  const prevMonth = month === 1 ? [year - 1, 12] : [year, month - 1];
  const prevFirst = `${prevMonth[0]}-${String(prevMonth[1]).padStart(2, "0")}-01`;

  const { data: prevReserve } = await supabase
    .from("financial_reserve")
    .select("ending_balance")
    .eq("month", prevFirst)
    .maybeSingle();

  const starting_balance = Number(prevReserve?.ending_balance ?? 0);

  const receitasCartao = await supabase
    .from("receitas")
    .select("valor")
    .eq("tipo", "cartao")
    .gte("data", start)
    .lte("data", end);

  const receitas = receitasCartao?.data ?? [];

  const total_card_revenue = receitas.reduce(
    (s, r) => s + Number(r.valor),
    0
  );

  const despesasReserva = await supabase
    .from("despesas")
    .select("valor")
    .gte("data", start)
    .lte("data", end)
    .eq("affects_reserve", true);

  const despesas = despesasReserva?.data ?? [];

  const total_reserve_expenses = despesas.reduce(
    (s, d) => s + Number(d.valor),
    0
  );

  const ending_balance = starting_balance + total_card_revenue - total_reserve_expenses;

  const { error } = await supabase.from("financial_reserve").upsert(
    {
      month: monthFirst,
      starting_balance,
      ending_balance,
      total_card_revenue,
      total_reserve_expenses,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/financeiro");
}
