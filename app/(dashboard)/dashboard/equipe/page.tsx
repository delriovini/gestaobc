import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  createServerSupabaseAdminClient,
} from "@/lib/supabaseServer";
import type { Database } from "@/lib/database.types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "role" | "staff_level" | "avatar_url"
>;

type StaffLevel = Database["public"]["Enums"]["staff_level"];

const STAFF_LEVEL_ORDER: StaffLevel[] = [
  "ADMINISTRADOR",
  "MODERADOR",
  "SUPORTE",
  "TRAINEE",
];

export default async function EquipePage() {
  const supabase = await createServerSupabaseClient();
  const admin = createServerSupabaseAdminClient();
  const storageClient = admin ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, staff_level, avatar_url")
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data ?? []) as ProfileRow[];

  const ceos = profiles.filter(
    (p) => p.role && p.role.toUpperCase() === "CEO",
  );
  const gestores = profiles.filter(
    (p) => p.role && p.role.toUpperCase() === "GESTOR",
  );
  const staff = profiles.filter(
    (p) => p.role && p.role.toUpperCase() === "STAFF",
  );

  const staffByLevel = new Map<StaffLevel, ProfileRow[]>();
  for (const level of STAFF_LEVEL_ORDER) {
    staffByLevel.set(level, []);
  }
  for (const member of staff) {
    const level = member.staff_level;
    if (!level) continue;
    if (!staffByLevel.has(level)) {
      staffByLevel.set(level, []);
    }
    staffByLevel.get(level)!.push(member);
  }
  // Ordenar alfabeticamente por apelido (full_name) dentro de cada nível
  for (const level of STAFF_LEVEL_ORDER) {
    const list = staffByLevel.get(level);
    if (!list) continue;
    list.sort((a, b) => {
      const nameA = (a.full_name ?? "").trim().toUpperCase();
      const nameB = (b.full_name ?? "").trim().toUpperCase();
      if (!nameA && !nameB) return 0;
      if (!nameA) return 1;
      if (!nameB) return -1;
      return nameA.localeCompare(nameB);
    });
  }

  async function getAvatarUrl(path: string | null) {
    if (!path) return null;
    const trimmed = path.trim();
    // Se já for uma URL completa (legado), usa direto
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    const { data: signed } = await storageClient.storage
      .from("avatars")
      .createSignedUrl(trimmed, 3600);
    return signed?.signedUrl ?? null;
  }

  const ceosWithAvatars = await Promise.all(
    ceos.map(async (c) => ({
      ...c,
      avatarSignedUrl: await getAvatarUrl(c.avatar_url ?? null),
    })),
  );
  const gestoresWithAvatars = await Promise.all(
    gestores.map(async (g) => ({
      ...g,
      avatarSignedUrl: await getAvatarUrl(g.avatar_url ?? null),
    })),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Equipe</h1>
      </div>

      <div className="space-y-6">
        {/* CEO no topo da hierarquia */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400 text-center">
            CEO
          </h2>
          {ceosWithAvatars.length > 0 ? (
            ceosWithAvatars.length === 1 ? (
              <div className="flex justify-center">
                {ceosWithAvatars.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col items-center gap-3"
                  >
                    {c.avatarSignedUrl ? (
                      <img
                        src={c.avatarSignedUrl}
                        alt={c.full_name ?? "CEO"}
                        className="h-16 w-16 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-xl font-semibold text-blue-300">
                        {(c.full_name ?? "C").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        {c.full_name ?? "Sem nome"}
                      </p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                        CEO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {ceosWithAvatars.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col items-center gap-3"
                  >
                    {c.avatarSignedUrl ? (
                      <img
                        src={c.avatarSignedUrl}
                        alt={c.full_name ?? "CEO"}
                        className="h-16 w-16 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-xl font-semibold text-blue-300">
                        {(c.full_name ?? "C").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        {c.full_name ?? "Sem nome"}
                      </p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                        CEO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500 text-center">Nenhum CEO ativo.</p>
          )}
        </div>

        {/* Conector visual */}
        <div className="flex justify-center">
          <div className="h-10 w-px bg-white/15" />
        </div>

        {/* Gestores logo abaixo do CEO */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400 text-center">
            Gestores
          </h2>
          {gestoresWithAvatars.length > 0 ? (
            gestoresWithAvatars.length === 1 ? (
              <div className="flex justify-center">
                {gestoresWithAvatars.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col items-center gap-2 rounded-lg bg-slate-900/80 p-3"
                  >
                    {g.avatarSignedUrl ? (
                      <img
                        src={g.avatarSignedUrl}
                        alt={g.full_name ?? "Gestor"}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-semibold text-yellow-300">
                        {(g.full_name ?? "G").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        {g.full_name ?? "Sem nome"}
                      </p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-0.5 text-[11px] font-semibold text-yellow-300">
                        GESTOR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gestoresWithAvatars.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col items-center gap-2 rounded-lg bg-slate-900/80 p-3"
                  >
                    {g.avatarSignedUrl ? (
                      <img
                        src={g.avatarSignedUrl}
                        alt={g.full_name ?? "Gestor"}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-semibold text-yellow-300">
                        {(g.full_name ?? "G").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        {g.full_name ?? "Sem nome"}
                      </p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-0.5 text-[11px] font-semibold text-yellow-300">
                        GESTOR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500 text-center">Nenhum gestor ativo.</p>
          )}
        </div>

        {/* Conector visual */}
        <div className="flex justify-center">
          <div className="h-10 w-px bg-white/15" />
        </div>

        {/* Staff na base da hierarquia, agrupado por nível em colunas laterais */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400 text-center">
            Staff
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAFF_LEVEL_ORDER.map((level) => {
                const members = staffByLevel.get(level) ?? [];
                if (members.length === 0) return null;

                const label = level.charAt(0) + level.slice(1).toLowerCase();

                return (
                  <div
                    key={level}
                    className="rounded-lg bg-slate-900/80 p-3"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 text-center">
                      {label}
                    </p>
                    <ul className="space-y-1.5">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="text-sm text-slate-200 text-center sm:text-left"
                        >
                          {m.full_name ?? "Sem nome"}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {STAFF_LEVEL_ORDER.every(
              (level) => (staffByLevel.get(level) ?? []).length === 0,
            ) && (
              <p className="text-sm text-slate-500 text-center">
                Nenhum membro de staff ativo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

