import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTrainingButton } from "./DeleteTrainingButton";
import { NewTrainingForm } from "./NewTrainingForm";
import { createTraining, deleteTraining } from "./actions";

export async function TreinamentosAdminContent() {
  const supabase = await createClient();

  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white">
          Administração de Treinamentos
        </h2>
        <p className="mt-1 text-slate-400">
          Crie e gerencie os treinamentos disponíveis para a equipe.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Novo Treinamento</h3>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Preencha os dados abaixo para cadastrar um novo treinamento.
          </p>

          <NewTrainingForm createTraining={createTraining} />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Treinamentos Cadastrados
          </h3>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Lista de todos os treinamentos disponíveis.
          </p>

          {trainings && trainings.length > 0 ? (
            <ul className="space-y-3">
              {trainings.map((training) => (
                <li
                  key={training.id}
                  className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {training.title}
                      </h4>
                      {training.description && (
                        <p className="mt-1 text-xs text-slate-400">
                          {training.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        {training.is_required && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300">
                            Obrigatório
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/dashboard/treinamentos/admin/${training.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-700"
                      >
                        Gerenciar Aulas
                      </Link>
                      <DeleteTrainingButton
                        trainingId={training.id}
                        deleteAction={deleteTraining}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhum treinamento cadastrado até o momento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
