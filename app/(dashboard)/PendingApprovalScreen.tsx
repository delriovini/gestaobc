"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function formatStatus(status: string | null): string {
  if (!status) return "Pendente";
  const s = status.trim().toUpperCase();
  if (s === "PENDENTE") return "Pendente";
  if (s === "APROVADO") return "Aprovado";
  if (s === "REJEITADO") return "Rejeitado";
  return status;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

interface PendingApprovalScreenProps {
  status: string | null;
  createdAt: string | null;
}

export function PendingApprovalScreen({
  status,
  createdAt,
}: PendingApprovalScreenProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
        {/* Ícone animado de relógio */}
        <div className="mb-6 flex justify-center">
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20"
            aria-hidden
          >
            <svg
              className="h-8 w-8 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                className="clock-hand"
                d="M12 6v6l4 2"
                style={{ transformOrigin: "12px 12px" }}
              />
            </svg>
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
          </div>
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold tracking-tight text-white">
          Acesso em análise
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Seu cadastro está sendo analisado pela equipe. Você será notificado assim que o acesso for liberado.
        </p>

        <div className="space-y-4 rounded-xl border border-slate-700/40 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status atual</span>
            <span className="font-medium capitalize text-amber-400">
              {formatStatus(status)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Data de cadastro</span>
            <span className="font-medium text-slate-200">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Entre em contato com o administrador ou aguarde a liberação.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Verificar status novamente
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `@keyframes clock-tick { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .clock-hand { transform-origin: 12px 12px; animation: clock-tick 12s linear infinite; }`,
      }} />
    </div>
  );
}
