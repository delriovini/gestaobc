import { createClient as createBrowserClient } from "./supabase/client";

export function createClient() {
  return createBrowserClient();
}

