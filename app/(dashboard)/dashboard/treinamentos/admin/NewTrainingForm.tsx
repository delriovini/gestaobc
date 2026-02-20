"use client";

import { useState } from "react";

type NewTrainingFormProps = {
  createTraining: (formData: FormData) => Promise<void>;
};

export function NewTrainingForm({ createTraining }: NewTrainingFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Garante que o arquivo do estado seja enviado (evita coverFile: null no servidor)
    if (coverFile) {
      formData.set("cover_image", coverFile);
    }
    await createTraining(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      encType="multipart/form-data"
    >
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
          required
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
          placeholder="Ex.: Integração de Novos Colaboradores"
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
          placeholder="Breve descrição do conteúdo do treinamento"
        />
      </div>

      <div>
        <label
          htmlFor="cover_image"
          className="mb-1 block text-sm font-medium text-slate-300"
        >
          Imagem de capa
        </label>
        <input
          id="cover_image"
          name="cover_image"
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:hover:bg-cyan-500"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setCoverFile(e.target.files[0]);
            }
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_required"
          name="is_required"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
        />
        <label
          htmlFor="is_required"
          className="text-sm text-slate-300"
        >
          Treinamento obrigatório
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Salvar Treinamento
        </button>
      </div>
    </form>
  );
}
