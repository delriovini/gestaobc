import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse(
      "Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1) Não autenticado → /login (exceto rotas públicas de auth)
    if (!user) {
      const publicPaths = ["/login", "/forgot-password", "/register"];
      if (!publicPaths.includes(pathname)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return supabaseResponse;
    }

    // Proteção de rotas por role é feita nas páginas (profiles.role), não no JWT.

    // Permitir acesso normal
  } catch {
    const publicPaths = ["/login", "/forgot-password", "/register"];
    if (!publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}
