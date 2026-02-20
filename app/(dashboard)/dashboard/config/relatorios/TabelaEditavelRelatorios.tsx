"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertRelatoriosStaff, fecharMes, type RelatorioStaffInput } from "./actions";

export type RowEdit = {
  staff_id: string;
  nome: string | null;
  tickets_geral: number;
  tickets_security: number;
  tickets_otimizacao: number;
  allowlists: number;
  horas_conectadas: number;
  denuncias: number;
};

const COLS = "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr";

export function TabelaEditavelRelatorios({
  ano,
  mes,
  fechado,
  rows: initialRows,
}: {
  ano: number;
  mes: number;
  fechado: boolean;
  rows: RowEdit[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<RowEdit[]>(initialRows);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const update = (staffId: string, field: keyof RowEdit, value: number) => {
    if (fechado) return;
    setRows((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (fechado) return;
    setSaving(true);
    setMessage(null);
    const payload: RelatorioStaffInput[] = rows.map((r) => ({
      staff_id: r.staff_id,
      tickets_geral: r.tickets_geral,
      tickets_security: r.tickets_security,
      tickets_otimizacao: r.tickets_otimizacao,
      allowlists: r.allowlists,
      horas_conectadas: r.horas_conectadas,
      denuncias: r.denuncias,
    }));
    const result = await upsertRelatoriosStaff(ano, mes, payload);
    setSaving(false);
    if (result.error) setMessage({ type: "err", text: result.error });
    else {
      setMessage({ type: "ok", text: "Alterações salvas." });
      router.refresh();
    }
  };

  const handleFechar = async () => {
    setClosing(true);
    setMessage(null);
    const result = await fecharMes(ano, mes);
    setClosing(false);
    if (result.error) setMessage({ type: "err", text: result.error });
    else {
      setMessage({ type: "ok", text: "Mês fechado." });
      router.refresh();
    }
  };

  const num = (v: number) => (Number.isNaN(v) ? 0 : v);
  const disabled = fechado;

  return (
    <div className="space-y-4">
      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/95">
        <div
          className="grid gap-0 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="border-b border-slate-700 bg-slate-800 p-3">Nome</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Geral</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Security</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Tickets Otimização</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Allowlists</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Horas</div>
          <div className="border-b border-slate-700 bg-slate-800 p-3">Denúncias</div>
        </div>
        <div className="divide-y divide-slate-700">
          {rows.map((row) => (
            <div
              key={row.staff_id}
              className="grid items-center gap-0 hover:bg-slate-800/50"
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="p-3 text-center text-sm font-medium text-white">
                {row.nome ?? "—"}
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  value={row.tickets_geral}
                  onChange={(e) => update(row.staff_id, "tickets_geral", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  value={row.tickets_security}
                  onChange={(e) => update(row.staff_id, "tickets_security", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  value={row.tickets_otimizacao}
                  onChange={(e) => update(row.staff_id, "tickets_otimizacao", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  value={row.allowlists}
                  onChange={(e) => update(row.staff_id, "allowlists", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={row.horas_conectadas}
                  onChange={(e) => update(row.staff_id, "horas_conectadas", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
              <div className="p-2">
                <input
                  type="number"
                  min={0}
                  value={row.denuncias}
                  onChange={(e) => update(row.staff_id, "denuncias", num(Number(e.target.value)))}
                  disabled={disabled}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-center text-sm text-white disabled:opacity-60"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar Alterações"}
        </button>
        <button
          type="button"
          onClick={handleFechar}
          disabled={fechado || closing}
          className="rounded-lg border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {closing ? "Fechando…" : "Fechar Mês"}
        </button>
      </div>
    </div>
  );
}
