"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";

export type TaskStatus = "todo" | "in_progress" | "done";

const APP_TO_DB_STATUS: Record<TaskStatus, string> = {
  todo: "TODO",
  in_progress: "IN_PROGRESS",
  done: "DONE",
};

function toDbStatus(status: TaskStatus): string {
  return APP_TO_DB_STATUS[status] ?? "TODO";
}

function toAppStatus(dbStatus: string | null | undefined): TaskStatus {
  const map: Record<string, TaskStatus> = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
    todo: "todo",
    in_progress: "in_progress",
    done: "done",
  };
  return (map[dbStatus ?? ""] ?? "todo") as TaskStatus;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  assignee_nome?: string | null;
  [key: string]: unknown;
}

export async function getTasks(supabaseInstance?: SupabaseClient) {
  const supabase = supabaseInstance ?? (await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = normalizeRole(profile?.role ?? null);
  const canSeeAll = userRole === ROLES.CEO || userRole === ROLES.GESTOR;

  let tasks: Task[] = [];

  if (canSeeAll) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getTasks] Erro ao buscar tarefas (CEO/GESTOR):", error.message);
      return [];
    }
    const rawCount = (data ?? []).length;
    if (process.env.NODE_ENV === "development") {
      console.log("[getTasks] user=" + user.id + " role=" + (profile?.role ?? "null") + " userRole=" + (userRole ?? "null") + " canSeeAll=true rows=" + rawCount);
    }
    tasks = ((data ?? []) as Task[]).map((t) => ({
      ...t,
      status: toAppStatus(t.status as string),
    }));
  } else {
    // STAFF ou role null: ver apenas tarefas próprias (compatível com RLS)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getTasks] Erro ao buscar tarefas (próprias):", error.message);
      return [];
    }
    const rawCount = (data ?? []).length;
    if (process.env.NODE_ENV === "development") {
      console.log("[getTasks] user=" + user.id + " role=" + (profile?.role ?? "null") + " userRole=" + (userRole ?? "null") + " canSeeAll=false rows=" + rawCount);
    }
    tasks = ((data ?? []) as Task[]).map((t) => ({
      ...t,
      status: toAppStatus(t.status as string),
    }));
  }

  if (tasks.length === 0) return [];

  const assignedIds = [
    ...new Set(
      tasks
        .map((t) => t.assigned_to as string | null | undefined)
        .filter((id): id is string => !!id)
    ),
  ];

  let assigneeNames: Record<string, string> = {};
  if (assignedIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, full_name")
      .in("id", assignedIds);
    assigneeNames = Object.fromEntries(
      (profiles ?? []).map((p: { id: string; nome?: string | null; full_name?: string | null }) => [
        p.id,
        (p.full_name ?? p.nome ?? "—").trim() || "—",
      ])
    );
  }

  return tasks.map((t) => ({
    ...t,
    assignee_nome: (t.assigned_to && assigneeNames[t.assigned_to as string]) ?? null,
  }));
}

export interface CreateTaskOptions {
  title: string;
  description?: string | null;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
}

export async function createTask(payload: CreateTaskOptions) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: new Error(authError.message) };
  }

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const assignedTo = payload.assigned_to ?? user.id;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      status: "TODO",
      created_by: user.id,
      priority: payload.priority ?? null,
      due_date: payload.due_date ?? null,
      assigned_to: assignedTo,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: data ? { ...data, status: toAppStatus(data.status as string) } : null,
    error: null,
  };
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  priority?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
}

export async function updateTask(taskId: string, data: UpdateTaskData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("Usuário não autenticado") };
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description ?? null;
  if (data.priority !== undefined) updates.priority = data.priority ?? null;
  if (data.due_date !== undefined) {
    const v = data.due_date;
    updates.due_date = v == null || v === "" ? null : String(v).trim().slice(0, 10);
  }
  if (data.assigned_to !== undefined) updates.assigned_to = data.assigned_to ?? null;

  if (Object.keys(updates).length === 0) {
    return { data: null, error: null };
  }

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: updated ? { ...updated, status: toAppStatus(updated.status as string) } : null,
    error: null,
  };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("Usuário não autenticado") };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: toDbStatus(status) })
    .eq("id", taskId);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: { id: taskId, status }, error: null };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Usuário não autenticado") };
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  return { error };
}
