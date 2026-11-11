import "./globals.css";

export const metadata = {
  // Adresse du site pour les aperçus de lien (à mettre dans Vercel quand le nom de domaine sera pris).
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) } : {}),
  title: "Léon",
  description: "Léon garde un œil sur votre restaurant, même quand vous n'y êtes pas.",
  // Sur iPhone : « Partager → Sur l'écran d'accueil » ouvre Léon en plein écran, comme une appli.
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Léon", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#18352B" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Polices rangées dans le site : aucun appel à Google. */}
        <link rel="stylesheet" href="/polices/polices.css" />
        <link rel="preload" href="/polices/barlow-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
