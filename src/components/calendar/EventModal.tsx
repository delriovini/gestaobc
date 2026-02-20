"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { createEvent } from "@/lib/events";
import type { EventType } from "@/lib/events";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const TIPO_OPTIONS: { value: EventType; label: string }[] = [
  { value: "EVENTO_CIDADE", label: "Evento Cidade" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "TREINAMENTO", label: "Treinamento" },
  { value: "OUTRO", label: "Outro" },
];

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultMonth?: number;
  defaultYear?: number;
}

function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function EventModal({
  isOpen,
  onClose,
  onCreated,
  defaultMonth = new Date().getMonth() + 1,
  defaultYear = new Date().getFullYear(),
}: EventModalProps) {
  const defaultDate = new Date(defaultYear, defaultMonth - 1, 1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toLocalDate(defaultDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [type, setType] = useState<EventType>("OUTRO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const { error: createError } = await createEvent({
      title: trimmedTitle,
      description: description.trim() || null,
      event_date: date,
      start_time: startTime,
      end_time: endTime,
      type,
    });

    setLoading(false);

    if (createError) {
      setError(createError instanceof Error ? createError.message : "Erro ao criar evento");
      return;
    }

    setTitle("");
    setDescription("");
    setDate(toLocalDate(defaultDate));
    setStartTime("09:00");
    setEndTime("10:00");
    setType("OUTRO");
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
        <h2 className="mb-6 text-xl font-semibold text-white">Novo evento</h2>

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
            placeholder="Título do evento"
            disabled={loading}
            autoFocus
          />

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-slate-300">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={3}
              disabled={loading}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="date" className="block text-sm font-medium text-slate-300">
              Data
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startTime" className="block text-sm font-medium text-slate-300">
                Hora início
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-300">
                Hora fim
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="type" className="block text-sm font-medium text-slate-300">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              disabled={loading}
              className={inputClasses}
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
                  {opt.label}
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
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
