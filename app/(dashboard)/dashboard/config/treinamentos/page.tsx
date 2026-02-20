import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/with-role";
import { ROLES } from "@/lib/rbac";
import { deleteTraining, updateTraining } from "./actions";

type Training = {
  id: string;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  duration_seconds: number | null;
  is_required: boolean | null;
  created_at: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string | string[] }>;
}) {
  await requireRole(ROLES.GESTOR);

  const params = searchParams ? await searchParams : undefined;
  const editParam = params?.edit;
  const editId = Array.isArray(editParam) ? editParam[0] : editParam;

  const supabase = await createClient();

  const { data: trainings } = await supabase
    .from("trainings")
    .select(
      "id, title, description, vimeo_id, duration_seconds, is_required, created_at"
    )
    .order("created_at", { ascending: false });

  const trainingToEdit =
    editId && trainings ? trainings.find((t) => t.id === editId) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">
          Administração de Treinamentos
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gerencie os treinamentos disponíveis no sistema.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Lista de Treinamentos
          </h2>
          <Link
            href="/dashboard/treinamentos"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Ver como usuário
          </Link>
        </div>

        {trainings && trainings.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-300">
                    Título
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-300">
                    Obrigatório
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-300">
                    Duração
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-300">
                    Criado em
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/40">
                {trainings.map((training: Training) => (
                  <tr key={training.id} className="hover:bg-white/5">
                    <td className="px-4 py-2 align-top">
                      <div className="text-sm font-medium text-white">
                        {training.title}
                      </div>
                      {training.description && (
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                          {training.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-slate-200">
                      {training.is_required ? (
                        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-slate-200">
                      {training.duration_seconds != null
                        ? `${training.duration_seconds}s`
                        : "-"}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-slate-400">
                      {training.created_at
                        ? new Date(training.created_at).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/config/treinamentos?edit=${training.id}`}
                          className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-700"
                        >
                          Editar
                        </Link>
                        <form action={deleteTraining}>
                          <input type="hidden" name="id" value={training.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Nenhum treinamento cadastrado no momento.
          </p>
        )}
      </div>

      {editId && trainingToEdit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">
              Editar Treinamento
            </h2>
            <p className="mt-1 mb-4 text-sm text-slate-400">
              Atualize as informações do treinamento selecionado.
            </p>

            <form action={updateTraining} className="space-y-4">
              <input type="hidden" name="id" value={trainingToEdit.id} />

              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Título
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={trainingToEdit.title}
                  required
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={trainingToEdit.description ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="vimeo_id"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Vimeo Video ID
                </label>
                <input
                  id="vimeo_id"
                  name="vimeo_id"
                  defaultValue={trainingToEdit.vimeo_id ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Duração em segundos
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min={0}
                  defaultValue={trainingToEdit.duration_seconds ?? undefined}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_required"
                  name="is_required"
                  type="checkbox"
                  defaultChecked={!!trainingToEdit.is_required}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <label
                  htmlFor="is_required"
                  className="text-sm text-slate-300"
                >
                  Treinamento obrigatório
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-3 pt-2">
                <Link
                  href="/dashboard/config/treinamentos"
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

