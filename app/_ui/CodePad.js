"use client";
import { useEffect, useRef, useState } from "react";

// Pavé pour un code à 4 chiffres : 4 ronds + clavier, marche aussi au clavier.
// onComplete(code) doit renvoyer une promesse : { ok, attente, message }.
export default function CodePad({ titre, sousTitre, onComplete, bas }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [wait, setWait] = useState(0);
  const [shake, setShake] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => { ref.current?.focus(); }, []);

  async function push(d) {
    if (busy || wait > 0 || code.length >= 4) return;
    const next = code + d;
    setCode(next);
    setMsg("");
    if (next.length === 4) {
      setBusy(true);
      let r;
      try { r = await onComplete(next); } catch (e) { r = { ok: false, message: "Pas de connexion. Réessayez." }; }
      setBusy(false);
      if (r && r.ok) return;
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setCode("");
      if (r && r.attente > 0) setWait(Math.ceil(r.attente));
      setMsg((r && r.message) || "Ce n'est pas le bon code.");
    }
  }
  function back() { if (!busy) setCode((c) => c.slice(0, -1)); }
  function onKey(e) {
    if (/^[0-9]$/.test(e.key)) push(e.key);
    else if (e.key === "Backspace") back();
  }

  return (
    <div className="cp" tabIndex={-1} ref={ref} onKeyDown={onKey}>
      {titre && <h1 className="cp-t">{titre}</h1>}
      {sousTitre && <p className="cp-s">{sousTitre}</p>}
      <div className={"cp-dots" + (shake ? " shake" : "")} aria-label={`${code.length} chiffre(s) sur 4`}>
        {[0, 1, 2, 3].map((i) => <i key={i} className={i < code.length ? "on" : ""} />)}
      </div>
      <p className="cp-msg" role="status" aria-live="polite">
        {wait > 0 ? `Trop d'essais. Attendez ${wait} s.` : busy ? "Vérification…" : msg}
      </p>
      <div className="cp-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => push(d)} disabled={wait > 0}>{d}</button>
        ))}
        <span />
        <button type="button" onClick={() => push("0")} disabled={wait > 0}>0</button>
        <button type="button" className="cp-back" onClick={back} aria-label="Effacer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11v12H9l-6-6z" /><path d="M12.5 9.5l5 5M17.5 9.5l-5 5" /></svg>
        </button>
      </div>
      {bas}
    </div>
  );
}
