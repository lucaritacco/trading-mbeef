import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión y protege rutas privadas:
//   /panel/*  (staff)         → sin sesión va a /panel/login   (lógica intacta)
//   /cuenta/* (usuarios beta) → sin sesión va a /login
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // --- Staff (/panel) — lógica existente, sin cambios ---
  const esPanel = path.startsWith("/panel");
  const esLogin = path === "/panel/login";

  if (esPanel && !esLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (esLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // --- Usuarios de beta (/cuenta) ---
  if (path.startsWith("/cuenta") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/panel/:path*", "/cuenta/:path*"],
};
