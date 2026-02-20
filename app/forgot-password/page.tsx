"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== "undefined" ? window.location.origin : "");
      const redirectTo = `${baseUrl}/update-password`;

      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (err) {
        setError(
          err.message.includes("rate limit")
            ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
            : err.message
        );
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
              Link enviado
            </h1>
            <div
              role="status"
              className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              Verifique sua caixa de entrada. Enviamos um link para redefinir sua senha em{" "}
              <span className="font-medium text-white">{email}</span>
            </div>
            <p className="mb-6 text-center text-sm text-slate-500">
              O link expira em 1 hora. Não recebeu? Verifique a pasta de spam ou{" "}
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="font-medium text-cyan-400 transition hover:text-cyan-300 hover:underline"
              >
                tente novamente
              </button>
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-medium text-white transition hover:bg-white/10"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    );
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
            Recuperar senha
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Informe seu email e enviaremos um link para redefinir sua senha
          </p>

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
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                autoComplete="email"
              />
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
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar link de recuperação
                    <svg
                      className="h-5 w-5 transition group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition group-hover:opacity-100" />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
