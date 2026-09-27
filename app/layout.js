import "./globals.css";

export const metadata = {
  title: "Léon",
  description: "Léon — l'app qui pilote tes restaurants",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
