"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CalendarDay } from "@/lib/calendar";
import type { EventWithProfiles, EventType } from "@/lib/events";
import { updateEvent } from "@/lib/events";
import { EventModal } from "@/components/calendar/EventModal";
import { EventDetailsModal } from "@/components/calendar/EventDetailsModal";

const eventTypeConfig = {
  EVENTO_CIDADE: { label: "Evento Cidade", color: "bg-blue-500" },
  REUNIAO: { label: "Reunião", color: "bg-purple-500" },
  TREINAMENTO: { label: "Treinamento", color: "bg-green-500" },
  OUTRO: { label: "Outro", color: "bg-gray-500" },
  ANIVERSARIO: { label: "Aniversário", color: "bg-amber-500" },
} as const satisfies Record<EventType, { label: string; color: string }>;

function getEventConfig(type: EventType | null | undefined) {
  if (type && type in eventTypeConfig) return eventTypeConfig[type];
  return eventTypeConfig.OUTRO;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getEventsForDay(events: EventWithProfiles[], date: Date): EventWithProfiles[] {
  const key = toDateKey(date);
  return events.filter((e) => e.event_date === key);
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const DRAGGABLE_PREFIX = "event-";
const DROPPABLE_PREFIX = "day-";

function DraggableEventCard({
  event,
  onClick,
  justDroppedRef,
}: {
  event: EventWithProfiles;
  onClick: () => void;
  justDroppedRef: React.MutableRefObject<boolean>;
}) {
  const config = getEventConfig(event.type as EventType | null);
  const isBirthday = event.id.startsWith("aniversario-");

  if (isBirthday) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if (justDroppedRef.current) {
            e.stopPropagation();
            return;
          }
          onClick();
        }}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        className="flex shrink-0 cursor-pointer items-center justify-between gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition hover:bg-white/10"
      >
        <span className="truncate text-xs text-slate-200">{event.title}</span>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs text-white ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${DRAGGABLE_PREFIX}${event.id}`,
    data: { event },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition: "transform 200ms ease",
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (justDroppedRef.current) {
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`flex shrink-0 cursor-grab items-center justify-between gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 transition hover:bg-white/10 active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <span className="truncate text-xs text-slate-200">{event.title}</span>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs text-white ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

function EventCardContent({ event }: { event: EventWithProfiles }) {
  const config = getEventConfig(event.type as EventType | null);
  return (
    <>
      <span className="truncate text-xs text-slate-200">{event.title}</span>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs text-white ${config.color}`}>
        {config.label}
      </span>
    </>
  );
}

function DroppableDayCell({
  cell,
  events,
  onEventClick,
  justDroppedRef,
  isOver,
  setNodeRef,
}: {
  cell: CalendarDay;
  events: EventWithProfiles[];
  onEventClick: (event: EventWithProfiles) => void;
  justDroppedRef: React.MutableRefObject<boolean>;
  isOver: boolean;
  setNodeRef: (element: HTMLElement | null) => void;
}) {
  const dayEvents = cell.date ? getEventsForDay(events, cell.date) : [];

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] flex-col rounded-lg border p-2 transition-colors ${
        cell.date !== null && isToday(cell.date)
          ? "border-blue-500"
          : "border-white/10"
      } ${isOver ? "bg-slate-800/70 ring-2 ring-cyan-500/50" : "bg-slate-900/30 hover:bg-slate-800/50"}`}
    >
      {cell.date !== null ? (
        <>
          <span
            className={`mb-1 block text-xs ${
              isToday(cell.date) ? "text-blue-400 font-medium" : "text-slate-400"
            }`}
          >
            {cell.date.getDate()}
          </span>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {dayEvents.map((event) => (
              <DraggableEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
                justDroppedRef={justDroppedRef}
              />
            ))}
          </div>
        </>
      ) : (
        <span className="text-slate-700">—</span>
      )}
    </div>
  );
}

interface CalendarViewProps {
  calendarDays: CalendarDay[];
  events: EventWithProfiles[];
  month: number;
  year: number;
  weekdays: string[];
  monthLabel: string;
  prevHref: string;
  nextHref: string;
}

export function CalendarView({
  calendarDays,
  events: initialEvents,
  month,
  year,
  weekdays,
  monthLabel,
  prevHref,
  nextHref,
}: CalendarViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithProfiles | null>(null);
  const [events, setEvents] = useState<EventWithProfiles[]>(initialEvents);
  const [activeEvent, setActiveEvent] = useState<EventWithProfiles | null>(null);
  const justDroppedRef = useRef(false);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  async function handleEventCreated() {
    setModalOpen(false);
    router.refresh();
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (!id.startsWith(DRAGGABLE_PREFIX)) return;
    const eventId = id.slice(DRAGGABLE_PREFIX.length);
    const event = events.find((ev) => ev.id === eventId);
    if (event) setActiveEvent(event);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveEvent(null);

    if (!over) return;
    const draggableId = String(active.id);
    if (!draggableId.startsWith(DRAGGABLE_PREFIX)) return;

    let newEventDate: string;
    const overId = String(over.id);
    if (overId.startsWith(DROPPABLE_PREFIX)) {
      newEventDate = overId.slice(DROPPABLE_PREFIX.length);
    } else if (overId.startsWith(DRAGGABLE_PREFIX)) {
      const targetEventId = overId.slice(DRAGGABLE_PREFIX.length);
      const targetEvent = events.find((ev) => ev.id === targetEventId);
      if (!targetEvent) return;
      newEventDate = targetEvent.event_date;
    } else return;

    const eventId = draggableId.slice(DRAGGABLE_PREFIX.length);
    const event = events.find((ev) => ev.id === eventId);
    if (!event || event.event_date === newEventDate) return;

    justDroppedRef.current = true;
    setTimeout(() => {
      justDroppedRef.current = false;
    }, 150);

    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, event_date: newEventDate } : ev))
    );

    updateEvent(eventId, { event_date: newEventDate }).then(({ error }) => {
      if (error) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === eventId ? { ...ev, event_date: event.event_date } : ev))
        );
        window.alert(error instanceof Error ? error.message : "Não foi possível mover o evento.");
      } else {
        if (selectedEvent?.id === eventId) {
          setSelectedEvent((prev) =>
            prev ? { ...prev, event_date: newEventDate } : null
          );
        }
      }
      router.refresh();
    });
  }

  function handleDragCancel() {
    setActiveEvent(null);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={prevHref}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                aria-label="Mês anterior"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="min-w-[180px] text-center text-2xl font-semibold capitalize tracking-tight text-white">
                {monthLabel}
              </h1>
              <Link
                href={nextHref}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                aria-label="Próximo mês"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo Evento
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-400">
            {weekdays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((cell, i) => {
              if (cell.date) {
                return (
                  <DroppableDayCellWrapper
                    key={i}
                    cell={cell}
                    events={events}
                    onEventClick={setSelectedEvent}
                    justDroppedRef={justDroppedRef}
                  />
                );
              }
              return (
                <div
                  key={i}
                  className="flex min-h-[140px] flex-col rounded-lg border border-white/10 bg-slate-900/30 p-2"
                >
                  <span className="text-slate-700">—</span>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 200 }}>
          {activeEvent ? (
            <div className="flex cursor-grabbing items-center justify-between gap-1 rounded border border-cyan-500/50 bg-slate-800/95 px-2 py-1 shadow-xl ring-2 ring-cyan-500/30">
              <EventCardContent event={activeEvent} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleEventCreated}
        defaultMonth={month}
        defaultYear={year}
      />
      <EventDetailsModal
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onUpdated={(updated) => {
          setSelectedEvent(updated);
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          router.refresh();
        }}
        onDeleted={() => {
          setSelectedEvent(null);
          router.refresh();
        }}
      />
    </>
  );
}

function DroppableDayCellWrapper({
  cell,
  events,
  onEventClick,
  justDroppedRef,
}: {
  cell: CalendarDay;
  events: EventWithProfiles[];
  onEventClick: (event: EventWithProfiles) => void;
  justDroppedRef: React.MutableRefObject<boolean>;
}) {
  const dateKey = cell.date ? toDateKey(cell.date) : "";
  const { isOver, setNodeRef } = useDroppable({
    id: `${DROPPABLE_PREFIX}${dateKey}`,
    data: { dateKey },
  });

  return (
    <DroppableDayCell
      cell={cell}
      events={events}
      onEventClick={onEventClick}
      justDroppedRef={justDroppedRef}
      isOver={isOver}
      setNodeRef={setNodeRef}
    />
  );
}
