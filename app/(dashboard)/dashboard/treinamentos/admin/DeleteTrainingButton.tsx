"use client";

import { useState } from "react";

type DeleteTrainingButtonProps = {
  trainingId: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteTrainingButton({
  trainingId,
  deleteAction,
}: DeleteTrainingButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Excluir treinamento"
        className="mt-2 flex items-center rounded-full p-1.5 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        aria-label="Excluir treinamento"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">
              Excluir treinamento
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Tem certeza que deseja excluir este treinamento? Todas as aulas serão removidas.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <form
                action={deleteAction}
                onSubmit={() => setOpen(false)}
                className="inline-block"
              >
                <input type="hidden" name="id" value={trainingId} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Excluir
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
