import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { getTasks } from "@/lib/tasks";
import type { Task, TaskStatus } from "@/lib/tasks";
import { getProfiles } from "@/lib/profiles";
import { KanbanPageContent } from "./KanbanPageContent";

export const dynamic = "force-dynamic";

const columnsOrder = ["todo", "in_progress", "done"] as const satisfies readonly TaskStatus[];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Demandas",
  in_progress: "Realizando",
  done: "Concluído",
};

const COLUMNS: { status: TaskStatus; label: string }[] = columnsOrder.map((status) => ({
  status,
  label: statusLabels[status],
}));

function groupTasksByStatus(tasks: Task[]) {
  const groups: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const task of tasks) {
    const status = (task.status ?? "todo") as TaskStatus;
    if (status in groups) {
      groups[status].push(task);
    } else {
      groups.todo.push(task);
    }
  }
  return groups;
}

export default async function KanbanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = normalizeRole(profile?.role ?? null);
  const showFilter = userRole === ROLES.CEO || userRole === ROLES.GESTOR;

  const [tasks, profiles] = await Promise.all([
    getTasks(supabase),
    showFilter ? getProfiles() : [],
  ]);

  const groupedTasks = groupTasksByStatus(tasks);

  return (
    <KanbanPageContent
      columns={COLUMNS}
      groupedTasks={groupedTasks}
      showFilter={showFilter}
      profiles={profiles}
    />
  );
}
