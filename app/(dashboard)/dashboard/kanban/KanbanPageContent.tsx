"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskStatus } from "@/lib/tasks";
import type { Profile } from "@/lib/profiles";
import { deleteTask, updateTaskStatus } from "@/lib/tasks";
import { KanbanBoard } from "./KanbanBoard";
import { TaskModal } from "@/components/kanban/TaskModal";

interface KanbanPageContentProps {
  columns: { status: TaskStatus; label: string }[];
  groupedTasks: Record<TaskStatus, Task[]>;
  showFilter?: boolean;
  profiles?: Profile[];
}

function flattenAndRegroup(
  grouped: Record<TaskStatus, Task[]>,
  filterUserId: string
): Record<TaskStatus, Task[]> {
  const flat = [
    ...(grouped.todo ?? []),
    ...(grouped.in_progress ?? []),
    ...(grouped.done ?? []),
  ];
  const filtered =
    filterUserId === ""
      ? flat
      : flat.filter((t) => (t.assigned_to ?? t.created_by) === filterUserId);
  const groups: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const task of filtered) {
    const status = (task.status ?? "todo") as TaskStatus;
    if (status in groups) {
      groups[status].push(task);
    } else {
      groups.todo.push(task);
    }
  }
  return groups;
}

export function KanbanPageContent({
  columns,
  groupedTasks,
  showFilter = false,
  profiles = [],
}: KanbanPageContentProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterUserId, setFilterUserId] = useState("");

  const filteredGroupedTasks = useMemo(
    () => flattenAndRegroup(groupedTasks, filterUserId),
    [groupedTasks, filterUserId]
  );

  async function handleDelete(taskId: string) {
    const { error } = await deleteTask(taskId);
    if (error) throw error;
    router.refresh();
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const { error } = await updateTaskStatus(taskId, status);
    if (error) throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Kanban</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie suas demandas em colunas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showFilter && profiles.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-user"
                className="text-sm font-medium text-slate-400"
              >
                Filtrar por:
              </label>
              <select
                id="filter-user"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">Todos</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome || "Sem nome"}
                  </option>
                ))}
              </select>
            </div>
          )}
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
          Nova Demanda
        </button>
        </div>
      </div>

      <TaskModal
        isOpen={modalOpen || !!editingTask}
        onClose={() => {
          if (editingTask) setEditingTask(null);
          else setModalOpen(false);
        }}
        onCreated={() => router.refresh()}
        task={editingTask}
        onUpdated={() => {
          setEditingTask(null);
          router.refresh();
        }}
      />

      <KanbanBoard
        columns={columns}
        groupedTasks={filteredGroupedTasks}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onEdit={(task) => setEditingTask(task)}
      />
    </div>
  );
}
