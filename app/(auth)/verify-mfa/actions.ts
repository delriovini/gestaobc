"use server";

import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function logMfaAttempt(success: boolean) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await supabase.from("mfa_attempt_logs").insert({
    user_id: user.id,
    success,
    ip_address: ipAddress,
  });
}

export async function recordMfaFailure(): Promise<{ justLocked?: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("mfa_failed_attempts")
    .eq("id", user.id)
    .single();

  const current = profile?.mfa_failed_attempts ?? 0;
  const next = current + 1;

  if (next >= 5) {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await supabase
      .from("profiles")
      .update({ mfa_locked_until: lockedUntil, mfa_failed_attempts: 0 })
      .eq("id", user.id);
    return { justLocked: true };
  }
  await supabase
    .from("profiles")
    .update({ mfa_failed_attempts: next })
    .eq("id", user.id);
  return {};
}

export async function recordMfaSuccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ mfa_failed_attempts: 0 })
    .eq("id", user.id);
}

export async function getMfaLockStatus(): Promise<{
  locked: boolean;
  lockedUntil: string | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { locked: false, lockedUntil: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("mfa_locked_until")
    .eq("id", user.id)
    .single();

  const lockedUntil = profile?.mfa_locked_until ?? null;
  const locked =
    lockedUntil != null && new Date(lockedUntil).getTime() > Date.now();

  return { locked, lockedUntil };
}
