import { createServerSupabaseClient as createServerClient } from "@/lib/supabaseServer";
import { syncBirthdayEvent } from "@/lib/calendar-events";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerClient();

  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(request.url);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile && profile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=inactive", request.url)
    );
  }

  let currentProfile = profile;

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        nome_completo: user.user_metadata?.nome_completo ?? user.user_metadata?.full_name ?? user.email ?? null,
        full_name: user.user_metadata?.full_name ?? null,
        email: user.email,
        role: "STAFF",
        status: "PENDENTE",
      })
      .select()
      .single();

    currentProfile = newProfile;
  }

  await syncBirthdayEvent(supabase, user.id, {
    birth_date: currentProfile?.birth_date ?? null,
    nome_completo: currentProfile?.nome_completo ?? null,
    full_name: currentProfile?.full_name ?? null,
  });

  if (currentProfile?.status !== "APROVADO") {
    return NextResponse.redirect(
      new URL("/aguardando-aprovacao", request.url)
    );
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();

  if (!factors || factors.totp.length === 0) {
    return NextResponse.redirect(new URL("/mfa/setup", request.url));
  }

  return NextResponse.redirect(new URL("/verify-mfa", request.url));
}
