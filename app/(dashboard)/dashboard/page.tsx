import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { getTasks } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/tasks";
import { getEventsInRange } from "@/lib/events";
import type { EventWithProfiles } from "@/lib/events";

const TAREFAS_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
  />
);

const EVENTOS_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
  />
);

/** Segunda a domingo em YYYY-MM-DD (semana da data atual). */
function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const pad = (d: Date) => d.toISOString().slice(0, 10);
  return { start: pad(monday), end: pad(sunday) };
}

function formatNextEventLabel(ev: EventWithProfiles): string {
  const today = new Date().toISOString().slice(0, 10);
  const date = ev.event_date;
  const time = (ev.start_time ?? "").slice(0, 5);
  const hour = time ? ` às ${time}` : "";

  if (date === today) return `Hoje${hour}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return `Amanhã${hour}`;
  const [y, m, d] = date.split("-");
  return `${String(Number(d)).padStart(2, "0")}/${String(Number(m)).padStart(2, "0")}${hour}`;
}

function getNextEventFromNow(events: EventWithProfiles[]): EventWithProfiles | null {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

  for (const ev of events) {
    if (ev.event_date > today) return ev;
    if (ev.event_date === today && (ev.start_time ?? "") >= nowTime) return ev;
  }
  return null;
}

const TREINAMENTOS_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
  />
);

function getBirthdaysThisMonth(
  profiles: { id: string; full_name: string | null; nome_completo: string | null; birth_date: string | null }[]
) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const result: { id: string; name: string; day: number; dateStr: string }[] = [];

  for (const p of profiles) {
    if (!p.birth_date || !String(p.birth_date).trim()) continue;
    const parts = String(p.birth_date).trim().split("-").map(Number);
    const month = parts[1];
    const day = parts[2];
    if (!month || !day || month !== currentMonth) continue;
    const name =
      (p.full_name && String(p.full_name).trim()) ||
      (p.nome_completo && String(p.nome_completo).trim()) ||
      "Usuário";
    result.push({
      id: p.id,
      name,
      day,
      dateStr: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    });
  }

  result.sort((a, b) => a.day - b.day);
  return result;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profilesWithBirthday } = await supabase
    .from("profiles")
    .select("id, full_name, nome_completo, birth_date")
    .not("birth_date", "is", null);

  const birthdaysThisMonth = getBirthdaysThisMonth(profilesWithBirthday ?? []);

  const tasks = await getTasks();
  const openStatuses: TaskStatus[] = ["todo", "in_progress"];
  const tarefasAbertas = tasks.filter((t) => openStatuses.includes((t.status ?? "todo") as TaskStatus));
  const todayStr = new Date().toISOString().slice(0, 10);
  const comPrazoHoje = tarefasAbertas.filter((t) => t.due_date && String(t.due_date).slice(0, 10) === todayStr);

  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const endNext = new Date();
  endNext.setDate(endNext.getDate() + 60);
  const endNextStr = endNext.toISOString().slice(0, 10);

  const [eventsThisWeek, eventsUpcoming] = await Promise.all([
    getEventsInRange(weekStart, weekEnd),
    getEventsInRange(todayStr, endNextStr),
  ]);

  const nextEvent = getNextEventFromNow(eventsUpcoming);
  const eventosEstaSemanaCount = eventsThisWeek.length;
  const proximoEventoLabel = nextEvent
    ? `Próximo evento será ${formatNextEventLabel(nextEvent)}`
    : eventosEstaSemanaCount === 0
      ? "Nenhum evento esta semana"
      : "Nenhum próximo evento";

  const { data: trainingsRows } = await supabase.from("trainings").select("id");
  const allTrainings = trainingsRows ?? [];
  const treinamentosPendentes = allTrainings.length;
  let comPrazoEstaSemana = 0;
  const { data: trainingsWithDue } = await supabase
    .from("trainings")
    .select("id")
    .not("due_date", "is", null)
    .gte("due_date", getWeekBounds().start)
    .lte("due_date", getWeekBounds().end);
  if (trainingsWithDue) comPrazoEstaSemana = trainingsWithDue.length;
  const treinamentosSubtitle =
    comPrazoEstaSemana > 0
      ? `${comPrazoEstaSemana} com prazo esta semana`
      : treinamentosPendentes === 0
        ? "Nenhum curso disponível"
        : `${treinamentosPendentes} curso${treinamentosPendentes !== 1 ? "s" : ""} disponíve${treinamentosPendentes !== 1 ? "is" : "l"}`;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Visão Geral</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/kanban" className="block transition-opacity hover:opacity-90">
          <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                Tarefas abertas
              </span>
              <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 p-2 text-blue-400 backdrop-blur-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {TAREFAS_ICON}
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{tarefasAbertas.length}</p>
            <p className="mt-1 text-xs text-slate-400">
              {comPrazoHoje.length} com prazo hoje
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/calendario" className="block transition-opacity hover:opacity-90">
          <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                Eventos esta semana
              </span>
              <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 p-2 text-blue-400 backdrop-blur-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {EVENTOS_ICON}
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{eventosEstaSemanaCount}</p>
            <p className="mt-1 text-xs text-slate-400">{proximoEventoLabel}</p>
          </Card>
        </Link>
        <Link href="/dashboard/treinamentos" className="block transition-opacity hover:opacity-90">
          <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
                Treinamentos pendentes
              </span>
              <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 p-2 text-blue-400 backdrop-blur-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {TREINAMENTOS_ICON}
                </svg>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{treinamentosPendentes}</p>
            <p className="mt-1 text-xs text-slate-400">{treinamentosSubtitle}</p>
          </Card>
        </Link>
        <Card className="border !border-slate-600/80 !bg-slate-800/90 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Aniversariantes do mês
            </span>
            <span className="rounded-lg border border-slate-600/70 bg-slate-700/80 p-2 text-amber-400 backdrop-blur-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2a7 7 0 0 1 7 7c0 5-4 9-7 12-3-3-7-7-7-12a7 7 0 0 1 7-7zm0 18v-2"
                />
              </svg>
            </span>
          </div>
          <div className="mt-3">
            {birthdaysThisMonth.length === 0 ? (
              <p className="text-xs text-slate-400">
                Nenhum aniversariante este mês.
              </p>
            ) : (
              <ul className="space-y-2">
                {birthdaysThisMonth.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-slate-600/50 bg-slate-700/30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-200">{b.name}</span>
                    <span className="text-slate-400">{b.dateStr}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
