"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserStatus } from "./actions";

interface ApproveRejectButtonsProps {
  userId: string;
}

export function ApproveRejectButtons({ userId }: ApproveRejectButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      await updateUserStatus(userId, "APROVADO");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      await updateUserStatus(userId, "REJEITADO");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading !== null}
        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading === "approve" ? "..." : "Aprovar"}
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={loading !== null}
        className="inline-flex items-center rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
      >
        {loading === "reject" ? "..." : "Rejeitar"}
      </button>
      <Link
        href={`/dashboard/usuarios/${userId}`}
        className="inline-flex items-center rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-600"
      >
        Editar
      </Link>
    </div>
  );
}
