"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventWithProfiles = Event & {
  profiles: { full_name: string | null }[];
};

export type EventType = "EVENTO_CIDADE" | "REUNIAO" | "TREINAMENTO" | "OUTRO" | "ANIVERSARIO";

const EVENTS_SELECT = `id, title, description, event_date, start_time, end_time, type, created_by, profiles:created_by (full_name)`;

/** Row retornado pelo Supabase (relação profiles pode vir como objeto ou array) */
type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  type: string | null;
  created_by: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

function normalizeEvent(row: EventRow): EventWithProfiles {
  const profiles = row.profiles
    ? Array.isArray(row.profiles)
      ? row.profiles
      : [row.profiles]
    : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    event_date: row.event_date,
    start_time: row.start_time,
    end_time: row.end_time,
    type: row.type ?? "",
    created_by: row.created_by,
    profiles,
  };
}

export interface CreateEventData {
  title: string;
  description?: string | null;
  event_date: string;
  start_time: string;
  end_time?: string | null;
  type?: EventType | null;
}

export interface UpdateEventData {
  title?: string;
  description?: string | null;
  event_date?: string;
  start_time?: string;
  end_time?: string | null;
  type?: EventType | null;
}

/**
 * Retorna o primeiro dia do mês em formato YYYY-MM-01.
 */
function getFirstDayOfMonth(month: number, year: number): string {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-01`;
}

/**
 * Retorna o último dia do mês em formato YYYY-MM-DD.
 */
function getLastDayOfMonth(month: number, year: number): string {
  const last = new Date(year, month, 0);
  const d = String(last.getDate()).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Verifica se dois intervalos de horário se sobrepõem.
 * Horários no formato "HH:MM" ou "HH:MM:SS".
 * end null é tratado como 23:59:59.
 */
function timesOverlap(
  startA: string,
  endA: string | null,
  startB: string,
  endB: string | null
): boolean {
  const norm = (t: string | null) => (t ?? "23:59:59").padEnd(8, ":00").slice(0, 8);
  const aEnd = norm(endA);
  const bEnd = norm(endB);
  return startA < bEnd && startB < aEnd;
}

const CONFLICT_MESSAGE = "Já existe um evento neste horário. Escolha outro horário ou data.";

interface ProfileBirthdayRow {
  id: string;
  nome_completo: string | null;
  full_name: string | null;
  birth_date: string | null;
}

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

function expandBirthdaysFromProfiles(
  profiles: ProfileBirthdayRow[],
  month: number,
  year: number
): EventWithProfiles[] {
  const firstDay = getFirstDayOfMonth(month, year);
  const lastDay = getLastDayOfMonth(month, year);
  const result: EventWithProfiles[] = [];

  for (const row of profiles) {
    if (!row.birth_date || !String(row.birth_date).trim()) continue;
    const parts = String(row.birth_date).trim().split("-").map(Number);
    let m = parts[1];
    let d = parts[2];
    if (!m || !d) continue;
    if (m === 2 && d === 29 && !isLeapYear(year)) d = 28;
    const eventDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (eventDate < firstDay || eventDate > lastDay) continue;
    const apelido = (row.full_name && String(row.full_name).trim()) || "";
    const nomeCompletoOuApelido = (row.nome_completo && String(row.nome_completo).trim()) || apelido || "Usuário";
    const title = `Aniversário - ${apelido || nomeCompletoOuApelido}`;
    const description = `Aniversário de ${nomeCompletoOuApelido}`;
    result.push({
      id: `aniversario-${row.id}`,
      title,
      description,
      event_date: eventDate,
      start_time: "00:00:00",
      end_time: null,
      type: "ANIVERSARIO",
      created_by: row.id,
      profiles: [{ full_name: row.full_name ?? row.nome_completo ?? null }],
    });
  }
  return result;
}

export async function getEvents(month: number, year: number): Promise<EventWithProfiles[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const firstDay = getFirstDayOfMonth(month, year);
  const lastDay = getLastDayOfMonth(month, year);

  const [eventsRes, profilesRes] = await Promise.all([
    supabase
      .from("events")
      .select(EVENTS_SELECT)
      .gte("event_date", firstDay)
      .lte("event_date", lastDay)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, nome_completo, full_name, birth_date")
      .not("birth_date", "is", null),
  ]);

  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const normalEvents = (eventsRes.data ?? []).map((r: EventRow) => normalizeEvent(r));
  const profileRows: ProfileBirthdayRow[] =
    profilesRes.error || !profilesRes.data ? [] : (profilesRes.data as ProfileBirthdayRow[]);
  const recurring = expandBirthdaysFromProfiles(profileRows, month, year);

  const combined = [...normalEvents, ...recurring].sort((a, b) => {
    if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });

  return combined;
}

/**
 * Retorna eventos (incluindo aniversários) entre startDate e endDate (YYYY-MM-DD, inclusivo).
 */
export async function getEventsInRange(startDate: string, endDate: string): Promise<EventWithProfiles[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [eventsRes, profilesRes] = await Promise.all([
    supabase
      .from("events")
      .select(EVENTS_SELECT)
      .gte("event_date", startDate)
      .lte("event_date", endDate)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, nome_completo, full_name, birth_date")
      .not("birth_date", "is", null),
  ]);

  if (eventsRes.error) return [];

  const normalEvents = (eventsRes.data ?? []).map((r: EventRow) => normalizeEvent(r));
  const profileRows: ProfileBirthdayRow[] =
    profilesRes.error || !profilesRes.data ? [] : (profilesRes.data as ProfileBirthdayRow[]);

  const result: EventWithProfiles[] = [];
  for (const row of profileRows) {
    if (!row.birth_date || !String(row.birth_date).trim()) continue;
    const parts = String(row.birth_date).trim().split("-").map(Number);
    let m = parts[1];
    let d = parts[2];
    if (!m || !d) continue;
    const year = new Date().getFullYear();
    if (m === 2 && d === 29 && !isLeapYear(year)) d = 28;
    const eventDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (eventDate < startDate || eventDate > endDate) continue;
    const apelido = (row.full_name && String(row.full_name).trim()) || "";
    const nomeCompletoOuApelido = (row.nome_completo && String(row.nome_completo).trim()) || apelido || "Usuário";
    result.push({
      id: `aniversario-${row.id}`,
      title: `Aniversário - ${apelido || nomeCompletoOuApelido}`,
      description: `Aniversário de ${nomeCompletoOuApelido}`,
      event_date: eventDate,
      start_time: "00:00:00",
      end_time: null,
      type: "ANIVERSARIO",
      created_by: row.id,
      profiles: [{ full_name: row.full_name ?? row.nome_completo ?? null }],
    });
  }

  const combined = [...normalEvents, ...result].sort((a, b) => {
    if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });

  return combined;
}

export async function createEvent(data: CreateEventData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: new Error(authError.message) };
  }

  if (!user) {
    return { data: null, error: new Error("Usuário não autenticado") };
  }

  if (!data.title?.trim()) {
    return { data: null, error: new Error("Título é obrigatório") };
  }

  if (!data.event_date) {
    return { data: null, error: new Error("Data do evento é obrigatória") };
  }

  if (!data.start_time) {
    return { data: null, error: new Error("Hora de início é obrigatória") };
  }

  const { data: existing } = await supabase
    .from("events")
    .select(EVENTS_SELECT)
    .eq("event_date", data.event_date);

  const dayEvents = (existing ?? []).map((r: EventRow) => normalizeEvent(r));
  const startTime = data.start_time;
  const endTime = data.end_time ?? null;

  const hasConflict = dayEvents.some((ev) => {
    if (ev.type === "ANIVERSARIO") return false;
    return timesOverlap(startTime, endTime, ev.start_time ?? "", ev.end_time);
  });

  if (hasConflict) {
    return { data: null, error: new Error(CONFLICT_MESSAGE) };
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      title: data.title.trim(),
      description: data.description ?? null,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time ?? null,
      type: data.type ?? null,
      created_by: user.id,
    })
    .select(EVENTS_SELECT)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  revalidatePath("/dashboard/calendario");
  return { data: created ? normalizeEvent(created as EventRow) : null, error: null };
}

export async function updateEvent(id: string, data: UpdateEventData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("Usuário não autenticado") };
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.event_date !== undefined) updates.event_date = data.event_date;
  if (data.start_time !== undefined) updates.start_time = data.start_time;
  if (data.end_time !== undefined) updates.end_time = data.end_time;
  if (data.type !== undefined) updates.type = data.type;

  if (Object.keys(updates).length === 0) {
    return { data: null, error: new Error("Nenhum campo para atualizar") };
  }

  const { data: current } = await supabase
    .from("events")
    .select(EVENTS_SELECT)
    .eq("id", id)
    .single();

  if (!current) {
    return { data: null, error: new Error("Evento não encontrado") };
  }

  const currentEvent = normalizeEvent(current as EventRow);
  const targetDate = (updates.event_date as string) ?? currentEvent.event_date;
  const targetStart = (updates.start_time as string) ?? currentEvent.start_time ?? "";
  const targetEnd = (updates.end_time as string | null) ?? currentEvent.end_time;

  const { data: existing } = await supabase
    .from("events")
    .select(EVENTS_SELECT)
    .eq("event_date", targetDate)
    .neq("id", id);

  const dayEvents = (existing ?? []).map((r: EventRow) => normalizeEvent(r));
  const hasConflict = dayEvents.some((ev) => {
    if (ev.type === "ANIVERSARIO") return false;
    return timesOverlap(targetStart, targetEnd, ev.start_time ?? "", ev.end_time);
  });

  if (hasConflict) {
    return { data: null, error: new Error(CONFLICT_MESSAGE) };
  }

  const { data: updated, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select(EVENTS_SELECT)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  revalidatePath("/dashboard/calendario");
  return { data: updated ? normalizeEvent(updated as EventRow) : null, error: null };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Usuário não autenticado") };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath("/dashboard/calendario");
  return { error: null };
}
