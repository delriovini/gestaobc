"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getMfaLockStatus,
  logMfaAttempt,
  recordMfaFailure,
  recordMfaSuccess,
} from "./actions";

function Logo() {
  return (
    <div className="flex justify-center">
      <img
        src="https://i.imgur.com/7mWUZKi.png"
        alt="Gestão BC"
        className="h-48 w-48 rounded-xl object-contain"
      />
    </div>
  );
}

export default function VerifyMfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initChallenge() {
      try {
        const { locked } = await getMfaLockStatus();
        if (cancelled) return;
        if (locked) {
          setIsLocked(true);
          setInitLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          if (!cancelled) {
            setError(factorsError.message);
            setInitLoading(false);
          }
          return;
        }

        const firstTotp = data?.totp?.[0];
        if (!firstTotp) {
          if (!cancelled) {
            setError("Nenhum fator MFA encontrado.");
            setInitLoading(false);
          }
          return;
        }

        const factorId = firstTotp.id;
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId });

        if (challengeError || !challengeData) {
          if (!cancelled) {
            setError(challengeError?.message ?? "Falha ao iniciar verificação.");
            setInitLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setFactorId(factorId);
          setChallengeId(challengeData.id);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Erro ao carregar verificação. Tente novamente.");
        }
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    }

    initChallenge();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }

    if (!factorId || !challengeId) {
      setError("Verificação não inicializada. Recarregue a página.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: trimmed,
      });

      if (verifyError) {
        await logMfaAttempt(false);
        const { justLocked } = await recordMfaFailure();
        if (justLocked) setIsLocked(true);
        setError(
          verifyError.message === "Invalid OTP"
            ? "Código inválido ou expirado. Tente novamente."
            : verifyError.message
        );
        setLoading(false);
        return;
      }

      await logMfaAttempt(true);
      await recordMfaSuccess();
      router.push("/dashboard");
      router.refresh();
    } catch {
      await logMfaAttempt(false);
      const { justLocked } = await recordMfaFailure();
      if (justLocked) setIsLocked(true);
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-1 flex flex-col items-center text-center text-2xl font-semibold text-white">
            <span>Verificação em duas etapas</span>
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Digite o código de 6 dígitos do seu aplicativo autenticador
          </p>

          {initLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                className="h-10 w-10 animate-spin text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-4 text-sm text-slate-400">Preparando verificação...</p>
            </div>
          ) : isLocked ? (
            <div
              role="alert"
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-center text-amber-200"
            >
              <p className="font-medium">
                Conta temporariamente bloqueada por tentativas inválidas.
              </p>
              <p className="mt-1 text-sm text-amber-200/90">
                Aguarde alguns minutos e tente novamente.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  <p className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Código de verificação
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  disabled={loading}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="mt-1.5 text-center text-xs text-slate-500">
                  6 dígitos do app autenticador
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verificando...
                    </>
                  ) : (
                    "Verificar código"
                  )}
                </span>
                <span className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition group-hover:opacity-100" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
