import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";
import { Card } from "@/components/ui/Card";
import { FinanceiroForms } from "./FinanceiroForms";
import { deleteReceitaForm, deleteDespesaForm } from "./actions";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type ReceitaRow = {
  id: string;
  valor: number;
  tipo: string;
  data: string;
  descricao: string | null;
};

type DespesaRow = {
  id: string;
  valor: number;
  data: string;
  descricao: string | null;
};

function getMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatDate(s: string) {
  return new Date(s + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function FinanceiroPage() {
  await requireRole(ROLES.CEO);

  const supabase = await createClient();
  const { start, end } = getMonthRange();

  const fixasRes = await supabase
    .from("despesas_fixas")
    .select("id, valor, descricao")
    .eq("ativa", true);
  const fixasTableMissing =
    fixasRes.error?.message?.includes("schema cache") ||
    fixasRes.error?.message?.includes("could not find the table");
  if (!fixasTableMissing && !fixasRes.error && fixasRes.data?.length) {
    for (const fixa of fixasRes.data as { id: string; valor: number; descricao: string | null }[]) {
      const exists = await supabase
        .from("despesas")
        .select("id")
        .eq("fixa_id", fixa.id)
        .gte("data", start)
        .lte("data", end)
        .maybeSingle();
      if (!exists.data) {
        await supabase.from("despesas").insert({
          descricao: fixa.descricao ?? null,
          valor: fixa.valor,
          data: start,
          tipo: "fixa",
          fixa_id: fixa.id,
        });
      }
    }
  }

  const [receitasRes, despesasRes] = await Promise.all([
    supabase
      .from("receitas")
      .select("id, valor, tipo, data, descricao")
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: false }),
    supabase
      .from("despesas")
      .select("id, valor, data, descricao")
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: false }),
  ]);

  const tablesMissing =
    receitasRes.error?.message?.includes("schema cache") ||
    receitasRes.error?.message?.includes("could not find the table") ||
    despesasRes.error?.message?.includes("schema cache") ||
    despesasRes.error?.message?.includes("could not find the table");

  if (!tablesMissing && receitasRes.error) throw new Error(receitasRes.error.message);
  if (!tablesMissing && despesasRes.error) throw new Error(despesasRes.error.message);

  const receitas = (tablesMissing ? [] : receitasRes.data ?? []) as ReceitaRow[];
  const despesas = (tablesMissing ? [] : despesasRes.data ?? []) as DespesaRow[];

  const totalReceitaCartao = receitas
    .filter((r) => r.tipo === "cartao")
    .reduce((s, r) => s + Number(r.valor), 0);
  const totalReceitaPix = receitas
    .filter((r) => r.tipo === "pix")
    .reduce((s, r) => s + Number(r.valor), 0);
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const lucroOperacional = totalReceitaCartao - totalDespesas;
  const lucroMes = totalReceitaCartao - totalDespesas;
  const totalPixDivisao = totalReceitaPix;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let fundSaldoAtual: number | null = null;
  let fundLucroMesDisplay: number | null = null;
  let fundSaldoAcumulado: number | null = null;
  let fundTableMissing = false;

  if (!tablesMissing) {
    const fundRes = await supabase
      .from("financial_fund")
      .select("*")
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .maybeSingle();

    const fundTableError =
      fundRes.error?.message?.includes("schema cache") ||
      fundRes.error?.message?.includes("could not find the table");
    if (fundTableError) {
      fundTableMissing = true;
    } else if (fundRes.error) {
      throw new Error(fundRes.error.message);
    } else {
      const existing = fundRes.data as {
        id: string;
        saldo_inicial: number;
        receita_cartao: number;
        total_despesas: number;
        lucro_mes: number;
        saldo_final: number;
      } | null;

      if (!existing) {
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevRes = await supabase
          .from("financial_fund")
          .select("saldo_final")
          .eq("year", prevYear)
          .eq("month", prevMonth)
          .maybeSingle();
        const saldoInicial = Number(
          (prevRes.data as { saldo_final: number } | null)?.saldo_final ?? 0
        );
        const saldoFinal = saldoInicial + lucroMes;
        const { error: insertErr } = await supabase.from("financial_fund").insert({
          year: currentYear,
          month: currentMonth,
          saldo_inicial: saldoInicial,
          receita_cartao: totalReceitaCartao,
          total_despesas: totalDespesas,
          lucro_mes: lucroMes,
          saldo_final: saldoFinal,
          updated_at: new Date().toISOString(),
        });
        if (insertErr) throw new Error(insertErr.message);
        fundSaldoAtual = saldoFinal;
        fundLucroMesDisplay = lucroMes;
        fundSaldoAcumulado = saldoFinal;
      } else {
        const saldoFinal = Number(existing.saldo_inicial) + lucroMes;
        const { error: updateErr } = await supabase
          .from("financial_fund")
          .update({
            receita_cartao: totalReceitaCartao,
            total_despesas: totalDespesas,
            lucro_mes: lucroMes,
            saldo_final: saldoFinal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (updateErr) throw new Error(updateErr.message);
        fundSaldoAtual = saldoFinal;
        fundLucroMesDisplay = lucroMes;
        const latestRes = await supabase
          .from("financial_fund")
          .select("saldo_final")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle();
        fundSaldoAcumulado = latestRes.data
          ? Number((latestRes.data as { saldo_final: number }).saldo_final)
          : saldoFinal;
      }
    }
  }

  const monthName = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full space-y-8 bg-slate-950 px-4 py-6">
      {tablesMissing && (
        <div className="rounded-xl border border-amber-600 bg-amber-950 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium text-white">Tabelas do módulo financeiro não encontradas.</p>
          <p className="mt-1 text-slate-400">
            No Supabase: SQL Editor → New query → execute o script <code className="rounded bg-slate-800 px-1 text-slate-200">supabase/scripts/setup_financeiro.sql</code>. Ou aplique as migrations com prefixo <code className="rounded bg-slate-800 px-1 text-slate-200">20260219</code>. Depois recarregue a página.
          </p>
        </div>
      )}
      <FinanceiroForms monthName={monthName} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Receita Cartão
            </span>
            <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 text-emerald-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6.375c.621 0 1.125.504 1.125 1.125v3.75M18 15.75h.007v.008h-.007v-.008zm-3.75 0h.007v.008h-.007v-.008zm-3.75 0h.007v.008h-.007v-.008zm-3.75 0h.007v.008h-.007v-.008z"
                />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-400">
            {BRL.format(totalReceitaCartao)}
          </p>
        </Card>

        <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Receita PIX
            </span>
            <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 text-cyan-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-cyan-400">
            {BRL.format(totalReceitaPix)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total para divisão</p>
        </Card>

        <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Total Despesas
            </span>
            <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 text-amber-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75V7.5a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h15a2.25 2.25 0 002.25-2.25m-18 0v-7.5a2.25 2.25 0 012.25-2.25h15"
                />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-400">
            {BRL.format(totalDespesas)}
          </p>
        </Card>

        <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Lucro do Servidor
            </span>
            <span
              className={`rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 ${
                lucroOperacional >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <p
            className={`mt-3 text-2xl font-bold ${
              lucroOperacional >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {BRL.format(lucroOperacional)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Cartão − despesas</p>
        </Card>
      </div>

      {!fundTableMissing && fundSaldoAtual !== null && fundLucroMesDisplay !== null && fundSaldoAcumulado !== null && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-white">Fundo financeiro</h2>
            <p className="text-sm text-slate-400">
              Controle automático por mês (atualizado ao carregar a página)
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  Saldo do Fundo Atual
                </span>
                <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 text-violet-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {BRL.format(fundSaldoAtual)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Saldo final do mês atual</p>
            </Card>
            <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  Lucro do mês
                </span>
                <span className={`rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 ${fundLucroMesDisplay >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className={`mt-3 text-2xl font-bold ${fundLucroMesDisplay >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {BRL.format(fundLucroMesDisplay)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Receita cartão − despesas</p>
            </Card>
            <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                  Saldo acumulado total
                </span>
                <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 backdrop-blur-sm p-2 text-violet-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021.75 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121.75 11.25v7.5" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {BRL.format(fundSaldoAcumulado)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Último saldo_final (ordenado por mês)</p>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-lg font-semibold text-white">
              Receitas do mês
            </h2>
            <p className="text-sm text-slate-400">
              Cartão e PIX em {monthName}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Valor
                  </th>
                  <th className="w-12 px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-900">
                {receitas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-200">
                      {formatDate(r.data)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          r.tipo === "pix"
                            ? "border-cyan-700 bg-slate-800 text-cyan-400"
                            : "border-emerald-700 bg-slate-800 text-emerald-400"
                        }`}
                      >
                        {r.tipo === "pix" ? "PIX" : "Cartão"}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-200">
                      {r.descricao || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-emerald-400">
                      {BRL.format(Number(r.valor))}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right">
                      <form action={deleteReceitaForm} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="inline-flex p-1.5 text-red-400 transition hover:text-red-500"
                          title="Excluir receita"
                          aria-label="Excluir receita"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {receitas.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      Nenhuma receita no mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-lg font-semibold text-white">
              Despesas do mês
            </h2>
            <p className="text-sm text-slate-400">
              Lançamentos em {monthName}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Valor
                  </th>
                  <th className="w-12 px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-900">
                {despesas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-200">
                      {formatDate(d.data)}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-sm text-slate-200">
                      {d.descricao || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-amber-400">
                      {BRL.format(Number(d.valor))}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right">
                      <form action={deleteDespesaForm} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className="inline-flex p-1.5 text-red-400 transition hover:text-red-500"
                          title="Excluir despesa"
                          aria-label="Excluir despesa"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {despesas.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      Nenhuma despesa no mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
