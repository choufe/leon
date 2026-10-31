"use client";
// Code à 4 chiffres pour rouvrir Léon : une fois tapé, l'appareil reste ouvert 12 h.
const CLE = "leon_ouvert_jusqu";
const DUREE = 12 * 3600 * 1000;

export function estDeverrouille() {
  try { return Number(localStorage.getItem(CLE) || 0) > Date.now(); } catch (_) { return false; }
}
export function marquerDeverrouille() {
  try { localStorage.setItem(CLE, String(Date.now() + DUREE)); } catch (_) {}
}
export function oublierDeverrouillage() {
  try { localStorage.removeItem(CLE); } catch (_) {}
}
