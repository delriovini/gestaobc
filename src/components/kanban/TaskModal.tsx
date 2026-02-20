"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { createTask, updateTask } from "@/lib/tasks";
import type { Task } from "@/lib/tasks";
import { getProfiles, type Profile } from "@/lib/profiles";

const PRIORITY_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
] as const;

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  task?: Task | null;
  onUpdated?: () => void;
}

export function TaskModal({ isOpen, onClose, onCreated, task: editingTask, onUpdated }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editingTask;

  useEffect(() => {
    if (isOpen) {
      getProfiles().then(setProfiles);
      if (editingTask) {
        setTitle(editingTask.title ?? "");
        setDescription(editingTask.description ?? "");
        setPriority((editingTask.priority ?? "").toString());
        const raw = editingTask.due_date ? String(editingTask.due_date).trim() : "";
        setDueDate(/^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "");
        setAssignedTo(editingTask.assigned_to ?? "");
      } else {
        setTitle("");
        setDescription("");
        setPriority("");
        setDueDate("");
        setAssignedTo("");
      }
    }
  }, [isOpen, editingTask?.id]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      setLoading(false);
      return;
    }

    if (isEdit && editingTask) {
      const dueDateValue = dueDate.trim();
      const { error: updateError } = await updateTask(editingTask.id, {
        title: trimmedTitle,
        description: description.trim() || null,
        priority: priority || null,
        due_date: dueDateValue ? dueDateValue.slice(0, 10) : null,
        assigned_to: assignedTo || null,
      });
      setLoading(false);
      if (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Erro ao salvar alterações");
        return;
      }
      onUpdated?.();
      onClose();
      return;
    }

    const { data, error: createError } = await createTask({
      title: trimmedTitle,
      description: description.trim() || null,
      priority: priority || null,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
    });

    setLoading(false);

    if (createError) {
      setError(createError instanceof Error ? createError.message : "Erro ao criar tarefa");
      return;
    }

    setTitle("");
    setDescription("");
    setPriority("");
    setDueDate("");
    setAssignedTo("");
    onCreated();
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-semibold text-white">
          {isEdit ? "Editar tarefa" : "Nova tarefa"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da tarefa"
            disabled={loading}
            autoFocus
          />

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-300"
            >
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={4}
              disabled={loading}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-slate-300"
              >
                Prioridade
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={loading}
                className={inputClasses}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value} className="bg-white text-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="due_date"
                className="block text-sm font-medium text-slate-300"
              >
                Prazo
              </label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="assigned_to"
              className="block text-sm font-medium text-slate-300"
            >
              Responsável
            </label>
            <select
              id="assigned_to"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={loading}
              className={inputClasses}
            >
              <option value="" className="bg-white text-slate-900">Eu (padrão)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-900">
                  {p.nome || "Sem nome"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
            >
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
