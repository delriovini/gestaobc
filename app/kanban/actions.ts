"use server";

import { createTask } from "@/lib/tasks";

export async function createTaskAction(
  title: string,
  description?: string | null
) {
  const { error } = await createTask({
    title,
    description: description ?? undefined,
  });
  if (error) throw error;
}
