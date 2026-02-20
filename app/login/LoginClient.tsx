"use client";

import LoginForm from "./LoginForm";

type LoginClientProps = {
  error?: string;
};

export default function LoginClient({ error }: LoginClientProps) {
  return (
    <div>
      {error === "inactive" && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          Seu acesso está pendente ou inativado. Aguarde aprovação.
        </div>
      )}

      <LoginForm />
    </div>
  );
}
