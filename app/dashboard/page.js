"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [restos, setRestos] = useState(null);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email);
      supabase
        .from("restaurants")
        .select("id, nom, type, ville")
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
            setRestos([]);
          } else {
            setRestos(data);
          }
        });
    });
  }, [router]);

  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1>Mes restaurants</h1>
        <p className="sub">Connecté en tant que {email}</p>
        {restos === null && <p>Chargement…</p>}
        {restos && restos.length === 0 && (
          <p className="sub">
            Aucun restaurant relié à ce compte pour l'instant. C'est normal
            au tout début — il faut d'abord créer ton organisation et ton
            premier restaurant côté base de données.
          </p>
        )}
        {restos && restos.length > 0 && (
          <ul className="restos">
            {restos.map((r) => (
              <li key={r.id}>
                <b>{r.nom}</b> <span className="sub">{r.ville}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="primary" onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
