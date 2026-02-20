import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeRole, ROLES } from "@/lib/rbac";
import { addComment, deleteComment } from "./actions";
import { VimeoPlayer } from "./VimeoPlayer";

type Training = {
  id: string;
  title: string;
  description: string | null;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  duration_seconds: number | null;
  order_index: number | null;
};

type CommentBase = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type CommentWithAvatar = CommentBase & {
  signedAvatarUrl?: string | null;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffH / 24);

  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `${diffMin} minuto${diffMin !== 1 ? "s" : ""} atrás`;
  if (diffH < 24) return `${diffH} hora${diffH !== 1 ? "s" : ""} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays !== 1 ? "s" : ""} atrás`;
  return date.toLocaleDateString("pt-BR");
}

export default async function TreinamentoPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("trainings")
    .select("id, title, description")
    .eq("id", id)
    .single();

  if (error) throw error;

  const training = data as Training;

  if (!training) {
    redirect("/dashboard/treinamentos");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = normalizeRole(profile?.role ?? null);
  const canModerate = role === ROLES.CEO || role === ROLES.GESTOR;

  const { data: lessonsData } = await supabase
    .from("training_lessons")
    .select("id, title, description, vimeo_id, duration_seconds, order_index")
    .eq("training_id", id)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  const lessons = (lessonsData ?? []) as Lesson[];

  const lessonParam = searchParams?.lesson;
  const requestedLessonId =
    typeof lessonParam === "string"
      ? lessonParam
      : Array.isArray(lessonParam)
        ? lessonParam[0]
        : null;

  const lessonsList = lessons ?? [];

  const selectedLesson =
    lessonsList.find((l) => l.id === requestedLessonId) ?? lessonsList[0] ?? null;

  const { data: comments } = await supabase
    .from("training_comments")
    .select("id, content, created_at, user_id, profiles(full_name, avatar_url)")
    .eq("training_id", id)
    .order("created_at", { ascending: false });

  const rawComments = (comments ?? []).map((c) => ({
    ...c,
    profiles: Array.isArray(c.profiles)
      ? c.profiles[0] ?? null
      : c.profiles,
  })) as CommentBase[];

  const commentList: CommentWithAvatar[] = await Promise.all(
    rawComments.map(async (c) => {
      const path = c.profiles?.avatar_url;
      if (!path) return c;

      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 3600);

      return {
        ...c,
        signedAvatarUrl: data?.signedUrl ?? null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">{training.title}</h1>
        {training.description && (
          <p className="mt-2 text-sm text-slate-300">{training.description}</p>
        )}
      </div>

      <div className="grid gap-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 shadow-lg backdrop-blur-sm lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        {/* Coluna esquerda: lista de aulas */}
        <div className="border-b border-white/10 pb-4 lg:border-b-0 lg:border-r lg:pr-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Aulas do treinamento
          </h2>
          {lessonsList.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma aula cadastrada ainda.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lessonsList.map((lesson) => {
                const isActive = selectedLesson?.id === lesson.id;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={{
                        pathname: `/dashboard/treinamentos/${id}`,
                        query: { lesson: lesson.id },
                      }}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 transition ${
                        isActive
                          ? "border-cyan-500/70 bg-cyan-500/10 text-white"
                          : "border-white/5 bg-slate-900/60 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-900"
                      }`}
                    >
                      {lesson.order_index != null && (
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-200">
                          {lesson.order_index}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-xs font-medium sm:text-sm">
                          {lesson.title}
                        </p>
                        {lesson.duration_seconds != null && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Duração: {lesson.duration_seconds}s
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Coluna direita: player + descrição da aula */}
        <div className="space-y-3">
          {selectedLesson ? (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">
                  {selectedLesson.title}
                </h2>
                {selectedLesson.description && (
                  <p className="text-sm text-slate-300">
                    {selectedLesson.description}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900 p-3">
                {selectedLesson.vimeo_id ? (
                  <VimeoPlayer
                    vimeoId={selectedLesson.vimeo_id}
                    lessonTitle={selectedLesson.title}
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    Nenhum vídeo configurado para esta aula.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhuma aula cadastrada ainda.
            </p>
          )}
        </div>
      </div>

      {/* Seção de comentários */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Comentários</h2>

        <form action={addComment} className="mt-4 space-y-3">
          <input type="hidden" name="training_id" value={id} />
          <textarea
            name="content"
            rows={3}
            required
            placeholder="Escreva um comentário..."
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Comentar
          </button>
        </form>

        <ul className="mt-6 space-y-4">
          {commentList.length === 0 ? (
            <li className="text-sm text-slate-500">
              Nenhum comentário ainda. Seja o primeiro a comentar.
            </li>
          ) : (
            commentList.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 rounded-lg border border-white/5 bg-slate-900/50 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-medium text-white">
                  {c.signedAvatarUrl ? (
                    <img
                      src={c.signedAvatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (c.profiles?.full_name ?? "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-white">
                      {c.profiles?.full_name?.trim() || "Usuário"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(c.created_at)}
                    </span>
                    {canModerate && (
                      <form
                        action={deleteComment}
                        className="ml-auto"
                      >
                        <input type="hidden" name="comment_id" value={c.id} />
                        <input
                          type="hidden"
                          name="training_id"
                          value={id}
                        />
                        <button
                          type="submit"
                          className="rounded-full p-1 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                          aria-label="Excluir comentário"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{c.content}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
