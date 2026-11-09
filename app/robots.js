// Ce que Google peut lire : la vitrine et les pages publiques, jamais l'app ni les espaces privés.
export default function robots() {
  return {
    rules: { userAgent: "*", allow: ["/", "/demande", "/mentions-legales", "/confidentialite"], disallow: ["/app", "/createur", "/tablette", "/tablette-demo", "/leon/", "/login", "/bienvenue", "/rejoindre", "/inscription"] },
  };
}
