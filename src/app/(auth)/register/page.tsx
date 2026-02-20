"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50";

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

export default function RegisterPage() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [apelido, setApelido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const nomeCompletoVal = nomeCompleto.trim();
    const apelidoVal = apelido.trim();
    if (!nomeCompletoVal) {
      setError("Informe o nome completo.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome_completo: nomeCompletoVal, full_name: apelidoVal || null },
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.includes("already registered")
            ? "Este email já está cadastrado. Faça login ou recupere sua senha."
            : signUpError.message
        );
        setLoading(false);
        return;
      }

      const user = data?.user;
      if (!user) {
        setError("Não foi possível criar a conta. Tente novamente.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nome_completo: nomeCompletoVal,
          full_name: apelidoVal || null,
          role: "STAFF",
          status: "PENDENTE",
        })
        .eq("id", user.id);

      if (updateError) {
        setError(
          "Conta criada, mas houve um erro ao salvar o perfil. Entre em contato com o suporte."
        );
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
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
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <h1 className="mb-1 flex flex-col items-center text-center text-2xl font-semibold text-white">
              Cadastro realizado
            </h1>
            <div
              role="status"
              className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              Cadastro enviado para aprovação.
            </div>
            <p className="mb-6 text-center text-slate-400">
              Aguarde a aprovação de um administrador para acessar o sistema.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-1 flex flex-col items-center text-center text-2xl font-semibold text-white">
            Criar conta
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Preencha os dados para solicitar acesso ao sistema
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
                htmlFor="nome_completo"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Nome completo
              </label>
              <input
                id="nome_completo"
                name="nome_completo"
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Seu nome completo"
                required
                disabled={loading}
                className={inputClasses}
                autoComplete="name"
              />
            </div>
            <div>
              <label
                htmlFor="full_name"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Apelido
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Como prefere ser chamado"
                disabled={loading}
                className={inputClasses}
              />
            </div>
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
                className={inputClasses}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
                className={inputClasses}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                disabled={loading}
                className={inputClasses}
                autoComplete="new-password"
                minLength={6}
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
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Enviar cadastro
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
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
