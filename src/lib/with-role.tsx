import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, normalizeRole, ROLES, type Role } from "./rbac";

export async function requireRole(requiredRole: Role) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = normalizeRole(profile?.role ?? null) ?? ROLES.STAFF;

  if (!hasPermission(userRole, requiredRole)) {
    redirect("/dashboard");
  }

  return { user, profile, userRole };
}
