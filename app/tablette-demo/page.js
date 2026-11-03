// La démo du Petit Beffroi en mode tablette : écran des codes, menu de la tablette, sans bandeau « démo ».
export default function TabletteDemo() {
  return (
    <iframe
      src="/leon/demo.html?tablette=1"
      title="Léon Tablette"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, background: "#18352B" }}
    />
  );
}
