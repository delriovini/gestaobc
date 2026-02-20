"use client";

import type { Task } from "@/lib/tasks";

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: {
    label: "Alta",
    className: "border-red-500/50 bg-red-500/20 text-red-300",
  },
  MEDIUM: {
    label: "Média",
    className: "border-amber-500/50 bg-amber-500/20 text-amber-300",
  },
  LOW: {
    label: "Baixa",
    className: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
  },
};

function formatDueDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const str = String(value).trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.exec(str)?.[0];
  if (dateOnly) {
    const [y, m, d] = dateOnly.split("-").map(Number);
    const dLocal = new Date(y, m - 1, d);
    if (Number.isNaN(dLocal.getTime())) return null;
    return dLocal.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === "done") return false;
  const str = String(dueDate).trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.exec(str)?.[0];
  if (dateOnly) {
    const [y, m, d] = dateOnly.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export interface TaskCardProps {
  task: Task;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const priorityKey = (task.priority ?? "").toUpperCase();
  const priority = PRIORITY_CONFIG[priorityKey];
  const dueFormatted = formatDueDate(task.due_date);
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      className={`group rounded-lg border bg-slate-800/50 p-4 shadow-sm transition hover:border-white/10 hover:bg-slate-800/70 ${
        overdue ? "border-red-500/40 bg-red-950/20" : "border-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">{task.title}</h3>
            {priority && (
              <span
                className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${priority.className}`}
              >
                {priority.label}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">
              {task.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {dueFormatted && (
              <span
                className={`flex items-center gap-1 ${
                  overdue ? "font-medium text-red-400" : ""
                }`}
              >
                {overdue && (
                  <span
                    className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-400"
                    title="Atrasado"
                  >
                    Atrasado
                  </span>
                )}
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {dueFormatted}
              </span>
            )}
            {(task.assignee_nome ?? task.assigned_to) && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {task.assignee_nome ?? "Responsável"}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label="Editar tarefa"
              className="rounded p-1.5 text-slate-400 transition hover:bg-cyan-500/20 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="Deletar tarefa"
              className="rounded p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
