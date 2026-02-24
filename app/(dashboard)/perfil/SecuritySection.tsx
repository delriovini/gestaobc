"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

interface SecuritySectionProps {
  mfaEnabled: boolean;
  onMfaChange: (enabled: boolean) => void;
}

export function SecuritySection({ mfaEnabled, onMfaChange }: SecuritySectionProps) {
  const router = useRouter();
  const [enrollState, setEnrollState] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"enroll" | "verify" | "disable" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleEnroll() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setAction("enroll");

    try {
      const supabase = createClient();

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasVerified = factorsData?.totp?.some(
        (f: { status: string }) => f.status === "verified"
      );
      if (hasVerified) {
        onMfaChange(true);
        router.replace("/dashboard");
        setLoading(false);
        setAction(null);
        return;
      }

      const unverifiedTotp = factorsData?.totp?.filter(
        (f: { id: string; status: string }) => f.status === "unverified"
      ) ?? [];
      for (const factor of unverifiedTotp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator",
      });

      if (enrollError) {
        setError(enrollError.message);
        setLoading(false);
        setAction(null);
        return;
      }

      const totp = data?.totp;
      if (!totp?.qr_code || !totp?.secret || !data?.id) {
        setError("Resposta inválida ao ativar 2FA.");
        setLoading(false);
        setAction(null);
        return;
      }

      setEnrollState({
        factorId: data.id,
        qrCode: totp.qr_code,
        secret: totp.secret,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao ativar 2FA.");
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollState) return;

    const code = verifyCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }

    setError(null);
    setLoading(true);
    setAction("verify");

    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollState.factorId });

      if (challengeError || !challengeData?.id) {
        setError(challengeError?.message ?? "Falha ao gerar verificação.");
        setLoading(false);
        setAction(null);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollState.factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        setError(
          verifyError.message === "Invalid OTP"
            ? "Código inválido ou expirado. Tente novamente."
            : verifyError.message
        );
        setLoading(false);
        setAction(null);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ mfa_enabled: true })
          .eq("id", user.id);
      }

      setEnrollState(null);
      setVerifyCode("");
      setSuccess("Autenticação em dois fatores ativada com sucesso.");
      onMfaChange(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao verificar código.");
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  function cancelEnroll() {
    setEnrollState(null);
    setVerifyCode("");
    setError(null);
  }

  async function handleDisable() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setAction("disable");

    try {
      const supabase = createClient();
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        setError(factorsError.message);
        setLoading(false);
        setAction(null);
        return;
      }

      const factor = factorsData?.totp?.find((f) => f.status === "verified");
      if (!factor) {
        setError("Nenhum fator 2FA ativo encontrado.");
        setLoading(false);
        setAction(null);
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) {
        setError(unenrollError.message);
        setLoading(false);
        setAction(null);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ mfa_enabled: false })
          .eq("id", user.id);
      }

      setSuccess("2FA desativado.");
      onMfaChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao desativar 2FA.");
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Segurança
      </h2>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      {enrollState ? (
        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-5">
          <p className="mb-4 text-sm text-slate-300">
            Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc.) ou insira o segredo manualmente. Depois digite o código de 6 dígitos.
          </p>
          <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {enrollState.qrCode.startsWith("data:") ? (
              <img
                src={enrollState.qrCode}
                alt="QR Code 2FA"
                className="h-40 w-40 rounded-lg border border-white/10 bg-white"
              />
            ) : (
              <div
                className="qr-container h-40 w-40 overflow-hidden rounded-lg border border-white/10 bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: enrollState.qrCode }}
              />
            )}
            <div className="flex-1">
              <p className="mb-1 text-xs font-medium text-slate-400">Segredo (manual)</p>
              <code className="block break-all rounded bg-slate-900/80 px-2 py-2 text-xs text-slate-200">
                {enrollState.secret}
              </code>
            </div>
          </div>
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) =>
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              disabled={loading}
              className={`${inputClasses} text-center text-lg tracking-widest`}
              autoComplete="one-time-code"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50"
              >
                {action === "verify" ? "Verificando..." : "Confirmar e ativar 2FA"}
              </button>
              <button
                type="button"
                onClick={cancelEnroll}
                disabled={loading}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {mfaEnabled ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                2FA ativo
              </span>
              <button
                type="button"
                onClick={handleDisable}
                disabled={loading}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {action === "disable" ? "Desativando..." : "Desativar 2FA"}
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-400">2FA não ativado</span>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={loading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50"
              >
                {action === "enroll" ? "Preparando..." : "Ativar autenticação em dois fatores"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
