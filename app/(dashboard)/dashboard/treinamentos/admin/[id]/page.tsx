import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/with-role";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { DeleteLessonButton } from "../DeleteLessonButton";

type Training = {
  id: string;
  title: string;
  description: string | null;
  is_required: boolean | null;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  duration_seconds: number | null;
  order_index: number | null;
  created_at: string;
};

async function createLesson(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();

  const training_id = formData.get("training_id") as string | null;
  const title = (formData.get("title") as string | null)?.trim() || "";
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const vimeo_id =
    (formData.get("vimeo_id") as string | null)?.trim() || null;
  const durationRaw =
    (formData.get("duration_seconds") as string | null)?.trim() || null;
  const orderRaw =
    (formData.get("order_index") as string | null)?.trim() || null;

  if (!training_id || !title) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);
  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    throw new Error("Sem permissão para criar aulas");
  }

  const duration_seconds =
    durationRaw && !Number.isNaN(Number(durationRaw))
      ? Number(durationRaw)
      : null;

  const order_index =
    orderRaw && !Number.isNaN(Number(orderRaw)) ? Number(orderRaw) : null;

  const { error } = await supabase.from("training_lessons").insert({
    training_id,
    title,
    description,
    vimeo_id,
    duration_seconds,
    order_index,
  });

  if (error) {
    console.error("Erro ao criar aula:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/treinamentos/admin/${training_id}`);
}

async function deleteLesson(formData: FormData) {
  "use server";

  const id = formData.get("id") as string | null;
  if (!id) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);
  if (!role || (role !== ROLES.CEO && role !== ROLES.GESTOR)) {
    throw new Error("Sem permissão para excluir aulas");
  }

  const { error } = await supabase
    .from("training_lessons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir aula:", error);
    throw new Error(error.message);
  }

  const training_id = formData.get("training_id") as string | null;
  if (training_id) {
    revalidatePath(`/dashboard/treinamentos/admin/${training_id}`);
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Garante que apenas CEO / GESTOR acessem
  await requireRole(ROLES.GESTOR);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trainings")
    .select("id, title, description, is_required")
    .eq("id", id)
    .single();

  if (error) throw error;

  const training = data as Training;

  if (!training) {
    redirect("/dashboard/treinamentos");
  }

  const { data: lessonsData } = await supabase
    .from("training_lessons")
    .select("id, title, description, vimeo_id, duration_seconds, order_index, created_at")
    .eq("training_id", id)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  const lessons = (lessonsData ?? []) as Lesson[];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">
          Aulas do Treinamento
        </h1>
        <p className="mt-1 text-slate-400">
          Gerencie as aulas do treinamento{" "}
          <span className="font-semibold text-white">{training.title}</span>.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Formulário de criação de aula */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">Nova Aula</h2>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Preencha os dados abaixo para adicionar uma nova aula ao
            treinamento.
          </p>

          <form action={createLesson} className="space-y-4">
            <input type="hidden" name="training_id" value={training.id} />

            <div>
              <label
                htmlFor="title"
                className="mb-1 block text-sm font-medium text-slate-300"
              >
                Título da aula
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                placeholder="Ex.: Introdução ao treinamento"
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
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                placeholder="Breve descrição do conteúdo da aula"
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
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                placeholder="Ex.: 123456789"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="duration_seconds"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Duração em segundos
                </label>
                <input
                  id="duration_seconds"
                  name="duration_seconds"
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="Ex.: 900 (15 minutos)"
                />
              </div>

              <div>
                <label
                  htmlFor="order_index"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Ordem da aula
                </label>
                <input
                  id="order_index"
                  name="order_index"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="Ex.: 1, 2, 3..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Salvar Aula
              </button>
            </div>
          </form>
        </div>

        {/* Lista de aulas */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">
            Aulas cadastradas
          </h2>
          <p className="mt-1 mb-4 text-sm text-slate-400">
            Lista de todas as aulas deste treinamento.
          </p>

          {lessons && lessons.length > 0 ? (
            <ul className="space-y-3">
              {lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {lesson.order_index != null && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-200">
                            {lesson.order_index}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-white">
                          {lesson.title}
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        {lesson.vimeo_id && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5">
                            Vimeo: {lesson.vimeo_id}
                          </span>
                        )}
                        {lesson.duration_seconds != null && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5">
                            Duração: {lesson.duration_seconds}s
                          </span>
                        )}
                      </div>
                    </div>
                    <DeleteLessonButton
                      lessonId={lesson.id}
                      trainingId={training.id}
                      deleteAction={deleteLesson}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhuma aula cadastrada ainda para este treinamento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

