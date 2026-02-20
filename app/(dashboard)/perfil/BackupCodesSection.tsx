"use client";

import { useState } from "react";
import { saveBackupCodeHashes } from "./backup-codes-actions";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  const part1 = Array.from(arr.slice(0, 4))
    .map((n) => CHARS[n % CHARS.length])
    .join("");
  const part2 = Array.from(arr.slice(4, 8))
    .map((n) => CHARS[n % CHARS.length])
    .join("");
  return `${part1}-${part2}`;
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function BackupCodesSection() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    try {
      const newCodes = Array.from({ length: 8 }, generateCode);
      const hashes = await Promise.all(newCodes.map((c) => hashCode(c)));

      const result = await saveBackupCodeHashes(hashes);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setCodes(newCodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar códigos.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!codes?.length) return;
    const text = [
      "Códigos de recuperação - Gestão BC",
      "Guarde em local seguro. Cada código só pode ser usado uma vez.",
      "",
      ...codes,
    ].join("\r\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigos-recuperacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleHide() {
    setCodes(null);
    setError(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Backup Codes
      </h2>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {codes ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="mb-3 text-sm font-medium text-amber-200">
            Guarde esses códigos em local seguro. Cada código só pode ser usado uma vez.
          </p>
          <ul className="mb-4 grid gap-2 font-mono text-sm text-slate-200 sm:grid-cols-2">
            {codes.map((code, i) => (
              <li key={i} className="rounded bg-slate-800/60 px-3 py-2">
                {code}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
            >
              Baixar como .txt
            </button>
            <button
              type="button"
              onClick={handleHide}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Ocultar códigos
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar códigos de recuperação"}
          </button>
        </div>
      )}
    </section>
  );
}
