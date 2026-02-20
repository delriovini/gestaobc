"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      });
      if (user) setIsRecovery(true);
      setCheckingAuth(false);
    };
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message.includes("same as") ? "A nova senha deve ser diferente da anterior." : error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => { router.push("/login"); router.refresh(); }, 2000);
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-sm text-slate-400">Verificando...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!isRecovery) {
    return (
      <AuthLayout>
        <h1 className="mb-1 text-center text-2xl font-semibold text-white">Link inválido ou expirado</h1>
        <p className="mb-8 text-center text-slate-400">Solicite um novo link de recuperação de senha para continuar.</p>
        <Link href="/forgot-password" className="block w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40">Solicitar novo link</Link>
        <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-medium text-cyan-400 transition hover:text-cyan-300">Voltar ao login</Link></p>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="mb-1 text-center text-2xl font-semibold text-white">Senha atualizada</h1>
          <p className="mb-8 text-center text-slate-400">Redirecionando para o login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-2xl font-semibold text-white">Nova senha</h1>
      <p className="mb-8 text-center text-slate-400">Defina uma nova senha segura para sua conta</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <p className="flex items-center gap-2"><svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>
          </div>
        )}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Nova senha</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} disabled={loading} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50" autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">Confirmar senha</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} disabled={loading} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={loading} className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? <><svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Atualizando...</> : <>Redefinir senha <svg className="h-5 w-5 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></>}
          </span>
          <span className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition group-hover:opacity-100" />
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-medium text-cyan-400 transition hover:text-cyan-300">Voltar ao login</Link></p>
    </AuthLayout>
  );
}
