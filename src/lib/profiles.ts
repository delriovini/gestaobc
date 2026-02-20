"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";

export interface Profile {
  id: string;
  nome: string | null;
  role?: string | null;
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
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

  if (userRole === ROLES.CEO || userRole === ROLES.GESTOR) {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .order("nome");
    const rows = data ?? [];
    return rows.map((p) => ({ id: p.id, nome: p.nome ?? null }));
  }

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("id", user.id)
    .single();

  if (!ownProfile) return [];
  return [{ id: ownProfile.id, nome: ownProfile.nome ?? null }];
}
