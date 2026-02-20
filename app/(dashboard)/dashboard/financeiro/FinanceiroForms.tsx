"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createReceita, createDespesa } from "./actions";

const today = () => new Date().toISOString().slice(0, 10);

export function FinanceiroForms({ monthName }: { monthName: string }) {
  const [showReceita, setShowReceita] = useState(false);
  const [showDespesa, setShowDespesa] = useState(false);
  const [receitaLoading, setReceitaLoading] = useState(false);
  const [despesaLoading, setDespesaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReceita(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setReceitaLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const valor = Number(formData.get("valor"));
    const tipo = (formData.get("tipo") as "cartao" | "pix") || "cartao";
    const data = String(formData.get("data") || today());
    const descricao = formData.get("descricao") ? String(formData.get("descricao")) : undefined;
    try {
      await createReceita({ valor, tipo, data, descricao });
      form.reset();
      setShowReceita(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar receita.");
    } finally {
      setReceitaLoading(false);
    }
  }

  async function handleDespesa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDespesaLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const valor = Number(formData.get("valor"));
    const data = String(formData.get("data") || today());
    const descricao = formData.get("descricao") ? String(formData.get("descricao")) : undefined;
    const tipo = (formData.get("tipo") as "avulsa" | "fixa_mensal") || "avulsa";
    try {
      await createDespesa({ valor, data, descricao, tipo });
      form.reset();
      setShowDespesa(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar despesa.");
    } finally {
      setDespesaLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Financeiro
          </h1>
          <p className="text-slate-400">
            Resumo e lançamentos do mês de{" "}
            <span className="capitalize text-slate-400">{monthName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="primary"
            className="!border-0 !from-emerald-500 !to-emerald-600 shadow-lg shadow-emerald-500/25 hover:!from-emerald-400 hover:!to-emerald-500 hover:shadow-emerald-500/40 focus:ring-emerald-500/50"
            onClick={() => {
              setShowReceita((v) => !v);
              setShowDespesa(false);
              setError(null);
            }}
          >
            Nova Receita
          </Button>
          <Button
            type="button"
            variant="danger"
            className="!border-0 !bg-red-600 !text-white shadow-lg shadow-red-500/25 hover:!bg-red-500 hover:!text-white hover:shadow-red-500/40 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            onClick={() => {
              setShowDespesa((v) => !v);
              setShowReceita(false);
              setError(null);
            }}
          >
            Nova Despesa
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {showReceita && (
        <div className="rounded-xl border border-slate-600/80 bg-slate-800/90 p-5 backdrop-blur-xl">
          <h3 className="mb-4 text-base font-semibold text-white">Registrar Receita</h3>
          <form onSubmit={handleReceita} className="flex flex-col gap-4 sm:max-w-md">
            <div>
              <label htmlFor="receita-valor" className="mb-1 block text-sm font-medium text-slate-400">
                Valor
              </label>
              <input
                id="receita-valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="receita-tipo" className="mb-1 block text-sm font-medium text-slate-400">
                Tipo
              </label>
              <select
                id="receita-tipo"
                name="tipo"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
              </select>
            </div>
            <div>
              <label htmlFor="receita-data" className="mb-1 block text-sm font-medium text-slate-400">
                Data
              </label>
              <input
                id="receita-data"
                name="data"
                type="date"
                defaultValue={today()}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="receita-descricao" className="mb-1 block text-sm font-medium text-slate-400">
                Descrição
              </label>
              <input
                id="receita-descricao"
                name="descricao"
                type="text"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <Button type="submit" variant="primary" loading={receitaLoading} disabled={receitaLoading}>
              Registrar Receita
            </Button>
          </form>
        </div>
      )}

      {showDespesa && (
        <div className="rounded-xl border border-slate-600/80 bg-slate-800/90 p-5 backdrop-blur-xl">
          <h3 className="mb-4 text-base font-semibold text-white">Registrar Despesa</h3>
          <form onSubmit={handleDespesa} className="flex flex-col gap-4 sm:max-w-md">
            <div>
              <label htmlFor="despesa-tipo" className="mb-1 block text-sm font-medium text-slate-400">
                Tipo de despesa
              </label>
              <select
                id="despesa-tipo"
                name="tipo"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="avulsa">Avulsa</option>
                <option value="fixa_mensal">Fixa mensal</option>
              </select>
            </div>
            <div>
              <label htmlFor="despesa-valor" className="mb-1 block text-sm font-medium text-slate-400">
                Valor
              </label>
              <input
                id="despesa-valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="despesa-data" className="mb-1 block text-sm font-medium text-slate-400">
                Data
              </label>
              <input
                id="despesa-data"
                name="data"
                type="date"
                defaultValue={today()}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="despesa-descricao" className="mb-1 block text-sm font-medium text-slate-400">
                Descrição
              </label>
              <input
                id="despesa-descricao"
                name="descricao"
                type="text"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <Button type="submit" variant="primary" loading={despesaLoading} disabled={despesaLoading}>
              Registrar Despesa
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
