import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type Training = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
};

export default async function TreinamentosPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: trainings } = await supabase
    .from("trainings")
    .select("id, title, description, cover_image_url")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Treinamentos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Escolha um treinamento para assistir.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        {trainings && trainings.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trainings.map((training: Training) => (
              <Link
                key={training.id}
                href={`/dashboard/treinamentos/${training.id}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-slate-900/80 shadow-md shadow-black/40 transition-transform duration-200 hover:scale-105 hover:border-cyan-500/50"
              >
                <div className="w-full shrink-0 overflow-hidden rounded-t-xl">
                  {training.cover_image_url && (
                    <img
                      src={training.cover_image_url}
                      alt={training.title}
                      className="h-48 w-full object-cover rounded-xl"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h2 className="line-clamp-1 text-sm font-semibold text-white">
                    {training.title}
                  </h2>
                  {training.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {training.description}
                    </p>
                  )}

                  <div className="mt-3">
                    <span className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow shadow-cyan-500/30 transition-colors group-hover:bg-cyan-500">
                      Assistir
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Nenhum treinamento disponível no momento.
          </p>
        )}
      </div>
    </div>
  );
}


