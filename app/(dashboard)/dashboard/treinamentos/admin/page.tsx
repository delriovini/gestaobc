import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { TreinamentosAdminContent } from "./TreinamentosAdminContent";

export default async function TreinamentosAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);

  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <TreinamentosAdminContent />
    </div>
  );
}
