import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/events";
import { generateCalendarDays } from "@/lib/calendar";
import { CalendarView } from "./CalendarView";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
/** Caminho do calendário: use /calendar ou /dashboard/calendario conforme a rota do projeto */
const CALENDAR_PATH = "/dashboard/calendario";

function prevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

function nextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

function calendarLink(month: number, year: number): string {
  return `${CALENDAR_PATH}?month=${month}&year=${year}`;
}

interface CalendarioPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarioPage({ searchParams }: CalendarioPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const month = params.month ? Math.min(12, Math.max(1, parseInt(params.month, 10) || now.getMonth() + 1)) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) || now.getFullYear() : now.getFullYear();

  const events = await getEvents(month, year);
  const calendarDays = generateCalendarDays(month, year);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const prev = prevMonth(month, year);
  const next = nextMonth(month, year);

  return (
    <div className="space-y-6">
      <CalendarView
        calendarDays={calendarDays}
        events={events}
        month={month}
        year={year}
        weekdays={WEEKDAYS}
        monthLabel={monthLabel}
        prevHref={calendarLink(prev.month, prev.year)}
        nextHref={calendarLink(next.month, next.year)}
      />
    </div>
  );
}
