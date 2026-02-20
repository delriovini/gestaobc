import { createClient } from "@/lib/supabase/server";
import {
  createRule,
  updateRulePoints,
  toggleRuleActive,
  deleteRule,
  createPointsLog,
  createMission,
  updateMission,
  toggleMission,
  deleteMission,
} from "./actions";
import { DeletePointsLogButton } from "./DeletePointsLogButton";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export async function GamificacaoAdminContent() {
  const supabase = await createClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: rules } = await supabase
    .from("gamification_rules")
    .select("id, name, points, type, is_active")
    .order("name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  const { data: currentMission } = await supabase
    .from("gamification_missions")
    .select("id, title, description, bonus_points, month, year")
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .eq("is_active", true)
    .maybeSingle();

  const { data: allMissions } = await supabase
    .from("gamification_missions")
    .select("id, title, description, bonus_points, month, year, is_active, created_at")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: allLogs } = await supabase
    .from("gamification_points")
    .select("*")
    .order("created_at", { ascending: false });

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name?.trim() || p.id.slice(0, 8)]));
  const ruleNameById = new Map((rules ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white">Administração de Gamificação</h2>
        <p className="mt-1 text-slate-400">
          Regras, lançamento de pontos e missão do mês.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* COLUNA 1 - REGRAS */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Regras</h3>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Criar, editar pontos, ativar/desativar ou excluir.
          </p>

          <form action={createRule} className="mb-6 space-y-3">
            <input
              name="name"
              placeholder="Nome da regra"
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
            />
            <div className="flex gap-2">
              <input
                name="points"
                type="number"
                placeholder="Pontos"
                required
                className="w-24 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
              />
              <select
                name="type"
                required
                className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                <option value="positive">Ganha Pontos</option>
                <option value="negative">Perde Pontos</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              Criar regra
            </button>
          </form>

          <ul className="space-y-3">
            {(rules ?? []).map((rule) => (
              <li
                key={rule.id}
                className={`rounded-lg border px-3 py-2 ${
                  rule.is_active ? "border-white/10 bg-slate-800/50" : "border-white/5 bg-slate-900/80 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{rule.name}</span>
                  <span className="text-xs text-slate-400">
                  {rule.type === "negative" ? "Perde Pontos" : "Ganha Pontos"}
                </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form action={updateRulePoints} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={rule.id} />
                    <input
                      name="points"
                      type="number"
                      defaultValue={rule.points}
                      className="w-16 rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600"
                    >
                      Ok
                    </button>
                  </form>
                  <form action={toggleRuleActive}>
                    <input type="hidden" name="id" value={rule.id} />
                    <input type="hidden" name="is_active" value={String(!rule.is_active)} />
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      {rule.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteRule}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {(!rules || rules.length === 0) && (
              <li className="text-sm text-slate-500">Nenhuma regra cadastrada.</li>
            )}
          </ul>
        </div>

        {/* COLUNA 2 - LANÇAR PONTOS */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Lançar pontos</h3>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Selecione usuário e regra. Os pontos são definidos pela regra (não editáveis).
          </p>

          <form action={createPointsLog} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Usuário</label>
              <select
                name="user_id"
                required
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                <option value="">Selecione</option>
                {(profiles ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name?.trim() || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Regra</label>
              <select
                name="rule_id"
                required
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                <option value="">Selecione</option>
                {(rules ?? []).filter((r) => r.is_active).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.points >= 0 ? "+" : ""}{r.points} pts)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Quantidade</label>
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                placeholder="1"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
              />
              <p className="mt-0.5 text-xs text-slate-500">Vezes que a regra será aplicada (ex.: 10 = soma 10× os pontos da regra em um único lançamento).</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Descrição (opcional)</label>
              <input
                name="description"
                placeholder="Observação do lançamento"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              Adicionar
            </button>
          </form>

          <h4 className="mt-6 text-sm font-semibold text-white">Histórico de lançamentos</h4>
          <p className="mt-0.5 text-xs text-slate-400">
            Últimos lançamentos manuais (mais recentes primeiro).
          </p>
          {(!allLogs || allLogs.length === 0) ? (
            <p className="mt-3 text-sm text-slate-500">Nenhum lançamento ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2 max-h-[320px] overflow-y-auto">
              {allLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-slate-800/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-medium text-white" title={log.user_id}>
                        {profileByUserId.get(log.user_id) ?? `${log.user_id?.slice(0, 8)}…`}
                      </span>
                      <span
                        className={
                          log.points >= 0
                            ? "font-medium text-green-400"
                            : "font-medium text-red-400"
                        }
                      >
                        {log.points >= 0 ? "+" : ""}
                        {log.points} pts
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-400">
                      <span title={log.rule_id}>{ruleNameById.get(log.rule_id) ?? `${log.rule_id?.slice(0, 8)}…`}</span>
                      {log.description?.trim() ? (
                        <>
                          <span>·</span>
                          <span className="text-slate-500 truncate" title={log.description}>
                            {log.description}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <DeletePointsLogButton logId={log.id} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* COLUNA 3 - MISSÃO DO MÊS */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Missão do mês</h3>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            {MONTH_NAMES[currentMonth - 1]} de {currentYear}. Apenas uma ativa por mês.
          </p>

          {currentMission ? (
            <div className="mb-6 rounded-lg border border-white/10 bg-slate-800/50 p-4">
              <p className="font-medium text-white">{currentMission.title}</p>
              {currentMission.description && (
                <p className="mt-1 text-sm text-slate-300">{currentMission.description}</p>
              )}
              <p className="mt-2 text-sm text-cyan-400">Bônus: +{currentMission.bonus_points} pts</p>
              <EditMissionForm mission={currentMission} />
            </div>
          ) : null}

          <form action={createMission} className="space-y-3">
            <input
              name="title"
              placeholder="Título da missão"
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
            />
            <textarea
              name="description"
              placeholder="Descrição (obrigatória)"
              rows={2}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
            />
            <input
              name="bonus_points"
              type="number"
              placeholder="Bônus (pts)"
              required
              defaultValue={0}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              {currentMission ? "Substituir missão do mês" : "Criar missão"}
            </button>
          </form>

          <h4 className="mt-8 text-sm font-semibold text-white">Todas as missões</h4>
          <p className="mt-0.5 text-xs text-slate-400">
            Lista ordenada por ano, mês e data de criação (mais recentes primeiro).
          </p>
          {(!allMissions || allMissions.length === 0) ? (
            <p className="mt-3 text-sm text-slate-500">Nenhuma missão cadastrada.</p>
          ) : (
            <ul className="mt-3 space-y-3 max-h-[480px] overflow-y-auto">
              {(allMissions ?? []).map((mission) => (
                <li
                  key={mission.id}
                  className="rounded-lg border border-white/10 bg-slate-800/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{mission.title}</p>
                    <span
                      className={
                        mission.is_active
                          ? "rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400"
                          : "rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400"
                      }
                    >
                      {mission.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {MONTH_NAMES[mission.month - 1]} / {mission.year}
                    {" · "}
                    <span className="text-cyan-400">+{mission.bonus_points} pts</span>
                  </p>
                  {mission.description ? (
                    <p className="mt-1 text-sm text-slate-300 line-clamp-2">{mission.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                    <span className="text-xs text-slate-500 mr-1">✏ Editar:</span>
                    <EditMissionForm mission={mission} />
                    <form action={toggleMission} className="inline">
                      <input type="hidden" name="id" value={mission.id} />
                      <button
                        type="submit"
                        className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-500"
                        title={mission.is_active ? "Desativar" : "Ativar"}
                      >
                        🔁 {mission.is_active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                    <form action={deleteMission} className="inline">
                      <input type="hidden" name="id" value={mission.id} />
                      <button
                        type="submit"
                        className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                        title="Excluir"
                      >
                        🗑 Excluir
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EditMissionForm({
  mission,
}: {
  mission: { id: string; title: string; description: string | null; bonus_points: number; month: number; year: number };
}) {
  return (
    <form action={updateMission} className="mt-4 border-t border-white/10 pt-4">
      <input type="hidden" name="id" value={mission.id} />
      <input type="hidden" name="month" value={mission.month} />
      <input type="hidden" name="year" value={mission.year} />
      <input
        name="title"
        defaultValue={mission.title}
        required
        className="mb-2 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white"
      />
      <textarea
        name="description"
        defaultValue={mission.description ?? ""}
        rows={2}
        required
        className="mb-2 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white"
      />
      <input
        name="bonus_points"
        type="number"
        defaultValue={mission.bonus_points}
        required
        className="mb-2 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white"
      />
      <button
        type="submit"
        className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-600"
      >
        Salvar alterações
      </button>
    </form>
  );
}
