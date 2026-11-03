// Sa propre icône sur l'écran d'accueil : « Léon Tablette », qui rouvre toujours /tablette.
export const metadata = {
  title: "Léon Tablette",
  manifest: "/tablette.webmanifest",
  appleWebApp: { capable: true, title: "Léon Tablette", statusBarStyle: "black-translucent" },
};
export default function TabletteLayout({ children }) {
  return children;
}
