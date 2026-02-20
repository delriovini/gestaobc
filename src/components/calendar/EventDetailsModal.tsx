"use client";

import { useState, useEffect } from "react";
import { updateEvent, deleteEvent } from "@/lib/events";
import type { EventWithProfiles, EventType } from "@/lib/events";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const eventTypeConfig = {
  EVENTO_CIDADE: { label: "Evento Cidade", color: "bg-blue-500" },
  REUNIAO: { label: "Reunião", color: "bg-purple-500" },
  TREINAMENTO: { label: "Treinamento", color: "bg-green-500" },
  OUTRO: { label: "Outro", color: "bg-gray-500" },
  ANIVERSARIO: { label: "Aniversário", color: "bg-amber-500" },
} as const satisfies Record<EventType, { label: string; color: string }>;

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "EVENTO_CIDADE", label: "Evento Cidade" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "TREINAMENTO", label: "Treinamento" },
  { value: "OUTRO", label: "Outro" },
];

function getEventConfig(type: EventType | null | undefined) {
  if (type && type in eventTypeConfig) return eventTypeConfig[type];
  return eventTypeConfig.OUTRO;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface EventDetailsModalProps {
  event: EventWithProfiles | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedEvent: EventWithProfiles) => void;
  onDeleted?: () => void;
}

export function EventDetailsModal({ event, isOpen, onClose, onUpdated, onDeleted }: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState<EventType>("OUTRO");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setEventDate(event.event_date);
      setStartTime(event.start_time ?? "");
      setEndTime(event.end_time ?? "");
      setType((event.type as EventType) ?? "OUTRO");
      setIsEditing(false);
      setError(null);
    }
  }, [event]);

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const isBirthdayEvent = event?.id?.startsWith?.("aniversario-") ?? false;

  async function handleSave() {
    if (!event || isBirthdayEvent) return;
    setError(null);
    setLoading(true);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      setLoading(false);
      return;
    }

    const { data: updated, error: updateError } = await updateEvent(event.id, {
      title: trimmedTitle,
      description: description.trim() || null,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime.trim() || null,
      type,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Erro ao atualizar evento");
      return;
    }

    if (updated) {
      setIsEditing(false);
      onUpdated?.(updated);
    }
  }

  async function handleDelete() {
    if (!event || isBirthdayEvent) return;
    if (!window.confirm("Tem certeza que deseja excluir este evento?")) return;

    setLoading(true);
    setError(null);
    const { error: deleteError } = await deleteEvent(event.id);
    setLoading(false);

    if (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao excluir evento");
      return;
    }

    onDeleted?.();
  }

  const config = event ? getEventConfig(event.type as EventType | null) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {event ? (
          <>
            <div className="border-b border-white/10 p-6">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}
              <div className="mb-3 flex items-start justify-between gap-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título"
                    disabled={loading}
                    className={inputClasses}
                    autoFocus
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-white">{event.title}</h2>
                    {event.profiles?.[0]?.full_name && (
                      <p className="mb-1 mt-1 text-sm text-muted">
                        Responsável: {event.profiles[0].full_name}
                      </p>
                    )}
                  </div>
                )}
                {!isEditing && config && (
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-white ${config.color}`}
                  >
                    {config.label}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {isEditing ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Tipo</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as EventType)}
                        disabled={loading}
                        className={inputClasses}
                      >
                        {TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Data</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        disabled={loading}
                        className={inputClasses}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Hora início</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={loading}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Hora fim</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={loading}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 text-sm text-slate-400">
                    <p className="capitalize">{formatDate(event.event_date)}</p>
                    <p>
                      {event.start_time}
                      {event.end_time ? ` – ${event.end_time}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className={`${event.description || isEditing ? "border-b border-white/10" : ""} p-6`}>
              {isEditing ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    rows={3}
                    disabled={loading}
                    className={`${inputClasses} resize-none`}
                  />
                </div>
              ) : (
                event.description && (
                  <>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Descrição
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {event.description}
                    </p>
                  </>
                )
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 p-4">
              {isBirthdayEvent ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  Fechar
                </button>
              ) : isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    {loading ? "Salvando..." : "Salvar alterações"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="rounded-lg border border-cyan-500/50 px-4 py-2.5 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/10 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    Fechar
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="p-6">
            <p className="text-sm text-slate-500">Nenhum evento selecionado.</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
