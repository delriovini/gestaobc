"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/lib/tasks";
import { TaskCard } from "@/components/kanban/TaskCard";

interface KanbanBoardProps {
  columns: { status: TaskStatus; label: string }[];
  groupedTasks: Record<TaskStatus, Task[]>;
  onDelete?: (taskId: string) => Promise<void>;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onEdit?: (task: Task) => void;
}

const columnColors: Record<TaskStatus, string> = {
  todo: "border-slate-600/50 bg-slate-900/50",
  in_progress: "border-cyan-500/30 bg-slate-900/50",
  done: "border-emerald-500/30 bg-slate-900/50",
};

const columnHeaderColors: Record<TaskStatus, string> = {
  todo: "text-slate-400",
  in_progress: "text-cyan-400",
  done: "text-emerald-400",
};

function flattenGroupedTasks(grouped: Record<TaskStatus, Task[]>): Task[] {
  return [
    ...(grouped.todo ?? []),
    ...(grouped.in_progress ?? []),
    ...(grouped.done ?? []),
  ];
}

export function KanbanBoard({
  columns,
  groupedTasks: initialGroupedTasks,
  onDelete,
  onStatusChange,
  onEdit,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(() =>
    flattenGroupedTasks(initialGroupedTasks)
  );
  const [draggedTask, setDraggedTask] = useState<{ task: Task; fromStatus: TaskStatus } | null>(null);

  useEffect(() => {
    setTasks(flattenGroupedTasks(initialGroupedTasks));
  }, [initialGroupedTasks]);

  const groupedTasks = useMemo(() => {
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
  }, [tasks]);

  const handleDelete = useCallback(
    async (taskId: string) => {
      if (!onDelete) return;
      await onDelete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [onDelete]
  );

  const handleDragStart = useCallback(
    (task: Task, fromStatus: TaskStatus) => (e: React.DragEvent) => {
      setDraggedTask({ task, fromStatus });
      e.dataTransfer.setData("taskId", task.id);
      e.dataTransfer.setData("fromStatus", fromStatus);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (toStatus: TaskStatus) => (e: React.DragEvent) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("taskId");
      const fromStatus = e.dataTransfer.getData("fromStatus") as TaskStatus;
      setDraggedTask(null);

      if (!taskId || fromStatus === toStatus) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || !onStatusChange) return;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: toStatus } : t
        )
      );

      void (async () => {
        try {
          await onStatusChange(taskId, toStatus);
        } catch (err) {
          console.error("Erro ao atualizar status:", err);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: fromStatus } : t
            )
          );
        }
      })();
    },
    [tasks, onStatusChange]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {columns.map(({ status, label }) => {
        const tasks = groupedTasks[status] ?? [];
        return (
          <div
            key={status}
            className={`flex min-h-[400px] flex-col rounded-xl border ${columnColors[status]}`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
              <span
                className={`text-sm font-semibold uppercase tracking-wider ${columnHeaderColors[status]}`}
              >
                {label}
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-400">
                {tasks.length}
              </span>
            </div>
            <div
              className="flex-1 space-y-3 overflow-y-auto p-3"
              onDragOver={handleDragOver}
              onDrop={handleDrop(status)}
            >
              {tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={handleDragStart(task, status)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(status)}
                  className={`cursor-grab active:cursor-grabbing ${
                    draggedTask?.task.id === task.id ? "opacity-50" : ""
                  }`}
                >
                  <TaskCard
                    task={task}
                    onDelete={onDelete ? handleDelete : undefined}
                    onEdit={onEdit}
                  />
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg border border-dashed border-white/5 py-8">
                  <p className="text-xs text-slate-500">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
