"use server";

import { revalidatePath } from "next/cache";
import { createTask, deleteTask, updateTaskStatus } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/tasks";

export async function createTaskAction(
  title: string,
  description?: string | null
) {
  const { error } = await createTask({
    title,
    description: description ?? undefined,
  });
  if (error) throw error;
  revalidatePath("/dashboard/kanban");
}

export async function deleteTaskAction(taskId: string) {
  const { error } = await deleteTask(taskId);
  if (error) throw error;
  revalidatePath("/dashboard/kanban");
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const { error } = await updateTaskStatus(taskId, status);
  if (error) throw error;
  revalidatePath("/dashboard/kanban");
}
