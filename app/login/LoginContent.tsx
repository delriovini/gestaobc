"use client";

import { useSearchParams } from "next/navigation";

export default function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      {error === "inactive" && (
        <div className="alert">
          Seu acesso está pendente ou inativado.
        </div>
      )}
    </>
  );
}
