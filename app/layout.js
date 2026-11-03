import "./globals.css";

export const metadata = {
  title: "Léon",
  description: "Léon garde un œil sur votre restaurant, même quand vous n'y êtes pas.",
  // Sur iPhone : « Partager → Sur l'écran d'accueil » ouvre Léon en plein écran, comme une appli.
  appleWebApp: { capable: true, title: "Léon", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#18352B" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400..700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
