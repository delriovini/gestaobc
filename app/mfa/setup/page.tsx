"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function MfaSetupPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function enroll() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });

        if (cancelled) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (!data?.id || !data?.totp?.qr_code || !data?.totp?.secret) {
          setError("Falha ao gerar configuração 2FA.");
          setLoading(false);
          return;
        }

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao configurar 2FA.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    enroll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setError("Informe o código de 6 dígitos.");
      return;
    }

    setError(null);
    setConfirmLoading(true);

    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError || !challengeData?.id) {
        setError(challengeError?.message ?? "Falha ao verificar.");
        setConfirmLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: trimmed,
      });

      if (verifyError) {
        setError(
          verifyError.message === "Invalid OTP"
            ? "Código inválido ou expirado. Tente novamente."
            : verifyError.message
        );
        setConfirmLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao confirmar.");
    } finally {
      setConfirmLoading(false);
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
          <h1 className="mb-1 text-center text-2xl font-semibold text-white">
            Configurar autenticação em duas etapas
          </h1>
          <p className="mb-8 text-center text-slate-400">
            Escaneie o QR Code com seu app autenticador e digite o código gerado
          </p>

          {loading ? (
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
              <p className="mt-4 text-sm text-slate-400">Preparando...</p>
            </div>
          ) : error && !qrCode ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              {qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm font-medium text-slate-300">QR Code</p>
                  {qrCode.startsWith("data:") ? (
                    <img
                      src={qrCode}
                      alt="QR Code 2FA"
                      className="h-40 w-40 rounded-lg border border-white/10 bg-white"
                    />
                  ) : (
                    <div
                      className="h-40 w-40 overflow-hidden rounded-lg border border-white/10 bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: qrCode }}
                    />
                  )}
                </div>
              )}

              {secret && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-300">
                    Secret manual
                  </p>
                  <code className="block break-all rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    {secret}
                  </code>
                </div>
              )}

              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Código de 6 dígitos
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  disabled={confirmLoading}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={confirmLoading}
                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {confirmLoading ? (
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
                    "Confirmar ativação"
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
