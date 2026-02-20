"use client";

import { useRouter } from "next/navigation";
import { MESES } from "@/lib/types/relatorios";

export function AnoMesSelect({
  anos,
  anoAtual,
  mesAtual,
}: {
  anos: number[];
  anoAtual: number;
  mesAtual: number;
}) {
  const router = useRouter();

  const handleAno = (ano: string) => {
    const a = ano ? parseInt(ano, 10) : null;
    const m = a ? mesAtual : null;
    const url = a && m
      ? `/dashboard/config?tab=relatorios&ano=${a}&mes=${m}`
      : "/dashboard/config?tab=relatorios";
    router.push(url);
  };

  const handleMes = (mes: string) => {
    const m = mes ? parseInt(mes, 10) : null;
    const a = m ? anoAtual : null;
    const url = a && m
      ? `/dashboard/config?tab=relatorios&ano=${a}&mes=${m}`
      : "/dashboard/config?tab=relatorios";
    router.push(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <label htmlFor="rel-ano" className="mb-1 block text-xs font-medium text-slate-400">
          Ano
        </label>
        <select
          id="rel-ano"
          value={anoAtual}
          onChange={(e) => handleAno(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50"
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="rel-mes" className="mb-1 block text-xs font-medium text-slate-400">
          Mês
        </label>
        <select
          id="rel-mes"
          value={mesAtual}
          onChange={(e) => handleMes(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500/50"
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
