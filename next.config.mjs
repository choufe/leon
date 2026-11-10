/** @type {import('next').NextConfig} */
const securite = [
  // Léon ne s'affiche jamais dans le cadre d'un autre site (seul /app encadre /leon/app.html, même site).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securite },
      // L'appli (gros fichier) : toujours la dernière version, sans la retélécharger si elle n'a pas changé.
      { source: "/leon/:fichier*", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      // Les polices ne changent jamais : gardées un an par le navigateur.
      { source: "/polices/:fichier*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  // Un seul chemin : les vieilles adresses renvoient vers la bonne porte.
  async redirects() {
    return [
      { source: "/inscription", destination: "/login", permanent: false },
      { source: "/dashboard", destination: "/app", permanent: false },
      { source: "/tablette-demo", destination: "/leon/tablette.html", permanent: false },
    ];
  },
};
export default nextConfig;
