// 13.01 · Les démos ne sont plus publiques : seul le créateur (Maurice, connecté) les ouvre.
// Tout le monde passe par « Demander une démo ».
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = { matcher: ["/leon/demo.html", "/leon/tablette.html", "/tablette-demo"] };

export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const vers = (chemin) => NextResponse.redirect(new URL(chemin, request.url));
  if (!url || !key) return vers("/demande");
  const response = NextResponse.next();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => liste.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  try {
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return vers("/demande");
    const { data: createur, error } = await supabase.rpc("suis_createur");
    if (error) return vers("/createur");
    if (!createur) return vers("/demande");
    return response;
  } catch (e) {
    return vers("/createur");
  }
}
