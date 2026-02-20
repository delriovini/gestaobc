import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type MissionRow = {
  id: string;
  title: string;
  description: string | null;
  bonus_points: number;
};

type RuleRow = {
  id: string;
  name: string;
  points: number;
  type: string;
};

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function GamificacaoPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { month, year } = getCurrentMonthYear();
  const monthName = MONTH_NAMES[month - 1];

  const { data: ranking } = await supabase.rpc("get_gamification_ranking");

  type RankingRow = {
    user_id: string;
    total_points?: number | string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  };
  const normalizeTotal = (r: RankingRow) => {
    const t = r.total_points;
    if (t === null || t === undefined) return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  };
  const rankingList = (ranking ?? []).map((r: RankingRow) => ({
    user_id: r.user_id,
    total: normalizeTotal(r),
    full_name: r.full_name?.trim() || "Usuário",
    avatar_url: r.avatar_url ?? null,
  }));

  const signedAvatars: Record<string, string | null> = {};
  for (const r of rankingList) {
    if (r.avatar_url) {
      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(r.avatar_url, 3600);
      signedAvatars[r.user_id] = data?.signedUrl ?? null;
    } else {
      signedAvatars[r.user_id] = null;
    }
  }

  // 2) Regras ativas (para o usuário conhecer as regras e pontuações)
  const { data: rules } = await supabase
    .from("gamification_rules")
    .select("id, name, points, type")
    .eq("is_active", true)
    .order("name");

  const typedRules = (rules ?? []) as RuleRow[];

  // 3) Missão ativa do mês atual
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: mission } = await supabase
    .from("gamification_missions")
    .select("*")
    .eq("is_active", true)
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .maybeSingle();

  const { data: history } = await supabase
    .from("gamification_points")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Gamificação</h1>
        <p className="mt-1 text-slate-400">
          Ranking e missão de {monthName} de {year}.
        </p>
      </div>

      {/* Ranking do mês - Top 5 */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">
          Ranking do mês
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Top 5 por pontos em {monthName}/{year}.
        </p>

        {rankingList.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Nenhum ponto registrado neste mês.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {/* 1º lugar - card grande */}
            {rankingList[0] && (
              <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-2xl font-bold text-amber-400">
                    {signedAvatars[rankingList[0].user_id] ? (
                      <img
                        src={signedAvatars[rankingList[0].user_id]!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      rankingList[0].full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {rankingList[0].full_name}
                    </p>
                    <p className="text-2xl font-bold text-amber-400">
                      {rankingList[0].total} pts
                    </p>
                  </div>
                  <div className="ml-auto rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
                    1º
                  </div>
                </div>
              </div>
            )}

            {/* 2º e 3º - cards médios */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((idx) => {
                const r = rankingList[idx];
                if (!r) return null;
                const border = idx === 1 ? "border-slate-400/50" : "border-amber-700/50";
                return (
                  <div
                    key={r.user_id}
                    className={`rounded-xl border ${border} bg-slate-800/50 p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-lg font-semibold text-slate-200">
                        {signedAvatars[r.user_id] ? (
                          <img
                            src={signedAvatars[r.user_id]!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          r.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {r.full_name}
                        </p>
                        <p className="text-lg font-semibold text-cyan-400">
                          {r.total} pts
                        </p>
                      </div>
                      <span className="ml-auto text-sm font-medium text-slate-400">
                        {idx + 1}º
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4º e 5º - lista simples */}
            <ul className="space-y-2">
              {[3, 4].map((idx) => {
                const r = rankingList[idx];
                if (!r) return null;
                return (
                  <li
                    key={r.user_id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-800/30 px-4 py-2"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-medium text-slate-200">
                      {signedAvatars[r.user_id] ? (
                        <img
                          src={signedAvatars[r.user_id]!}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        r.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="flex-1 text-sm text-white">
                      {r.full_name}
                    </span>
                    <span className="text-sm font-medium text-slate-300">
                      {r.total} pts
                    </span>
                    <span className="text-xs text-slate-500">{idx + 1}º</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Regras e pontuações */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Regras e pontuações</h2>
        <p className="mt-1 text-sm text-slate-400">
          Regras ativas e quantos pontos cada uma concede ou desconta.
        </p>

        {!typedRules.length ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma regra cadastrada no momento.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {typedRules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-800/30 px-4 py-2"
              >
                <span className="text-sm font-medium text-white">{rule.name}</span>
                <span
                  className={
                    rule.points >= 0
                      ? "text-sm font-medium text-green-400"
                      : "text-sm font-medium text-red-400"
                  }
                >
                  {rule.points >= 0 ? "+" : ""}
                  {rule.points} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Missão do mês */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Missão do mês</h2>
        {mission ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">{mission.title}</h3>
            {mission.description && (
              <p className="mt-2 text-sm text-slate-300">{mission.description}</p>
            )}
            <p className="mt-2 text-sm">
              <span className="text-slate-400">Bônus: </span>
              <span className="font-medium text-cyan-400">+{mission.bonus_points} pts</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma missão ativa neste mês.
          </p>
        )}
      </div>

      {/* Histórico pessoal */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Seu histórico</h2>
        <p className="mt-1 text-sm text-slate-400">
          Registro de pontos lançados para você.
        </p>

        {!history?.length ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhum registro ainda.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-800/30 px-4 py-2"
              >
                <span className="text-sm text-slate-300">
                  {new Date(item.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={
                    item.points >= 0
                      ? "text-sm font-medium text-green-400"
                      : "text-sm font-medium text-red-400"
                  }
                >
                  {item.points >= 0 ? "+" : ""}
                  {item.points} pts
                </span>
                {item.description?.trim() ? (
                  <span className="w-full mt-1 text-xs text-slate-500" title={item.description}>
                    {item.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
