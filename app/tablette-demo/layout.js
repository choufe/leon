// Tablette de démo (Le Petit Beffroi) : sa propre icône, comme la vraie tablette d'un client.
export const metadata = {
  title: "Léon Tablette · démo",
  manifest: "/tablette-demo.webmanifest",
  appleWebApp: { capable: true, title: "Léon Tablette", statusBarStyle: "black-translucent" },
};
export default function Layout({ children }) {
  return children;
}
