"use server";

import { createClient } from "@/lib/supabase/server";
import { syncBirthdayEvent } from "@/lib/calendar-events";
import { ensureActiveUser } from "@/lib/ensure-active-user";

export interface ProfileData {
  id: string;
  nome_completo: string | null;
  full_name: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  whatsapp: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  role: string | null;
  avatar_url: string | null;
  mfa_enabled: boolean | null;
}

export type ProfileUpdate = {
  nome_completo?: string | null;
  full_name?: string | null;
  cpf?: string | null;
  rg?: string | null;
  birth_date?: string | null;
  whatsapp?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  mfa_enabled?: boolean | null;
};

export async function getProfile(): Promise<ProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, nome_completo, full_name, cpf, rg, birth_date, whatsapp, cep, street, number, complement, neighborhood, city, state, avatar_url, role, mfa_enabled"
    )
    .eq("id", user.id)
    .single();

  return data as ProfileData | null;
}

export async function updateProfile(data: ProfileUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Usuário não autenticado") };
  }

  await ensureActiveUser(supabase, user.id);

  const updates: ProfileUpdate = {};

  if (data.nome_completo !== undefined) updates.nome_completo = data.nome_completo ?? null;
  if (data.full_name !== undefined) updates.full_name = data.full_name ?? null;
  if (data.cpf !== undefined) updates.cpf = data.cpf ?? null;
  if (data.rg !== undefined) updates.rg = data.rg ?? null;
  if (data.birth_date !== undefined) updates.birth_date = data.birth_date ?? null;
  if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp ?? null;
  if (data.cep !== undefined) updates.cep = data.cep ?? null;
  if (data.street !== undefined) updates.street = data.street ?? null;
  if (data.number !== undefined) updates.number = data.number ?? null;
  if (data.complement !== undefined) updates.complement = data.complement ?? null;
  if (data.neighborhood !== undefined) updates.neighborhood = data.neighborhood ?? null;
  if (data.city !== undefined) updates.city = data.city ?? null;
  if (data.state !== undefined) updates.state = data.state ?? null;
  // avatar_url: filePath retornado por uploadAvatar, não URL assinada
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url ?? null;
  if (data.role !== undefined) updates.role = data.role ?? null;
  if (data.mfa_enabled !== undefined) updates.mfa_enabled = data.mfa_enabled ?? null;

  if (Object.keys(updates).length === 0) return { error: null };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: new Error(error.message) };
  }

  const { data: profileAfter } = await supabase
    .from("profiles")
    .select("nome_completo, full_name, birth_date")
    .eq("id", user.id)
    .single();

  await syncBirthdayEvent(supabase, user.id, {
    birth_date: profileAfter?.birth_date ?? null,
    nome_completo: profileAfter?.nome_completo ?? null,
    full_name: profileAfter?.full_name ?? null,
  });

  return { error: null };
}

const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB

export async function uploadAvatar(file: File): Promise<string | undefined> {
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("Imagem deve ter no máximo 1MB.");
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  await ensureActiveUser(supabase, user.id);

  const filePath = `${user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  return filePath;
}
