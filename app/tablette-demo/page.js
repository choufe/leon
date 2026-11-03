"use client";
// Ancienne adresse : on ouvre directement la tablette de démo (sans cadre, plus fluide sur iPhone / iPad).
import { useEffect } from "react";
export default function TabletteDemo() {
  useEffect(() => { window.location.replace("/leon/tablette.html"); }, []);
  return null;
}
