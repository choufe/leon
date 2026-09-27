"use client";
// Stockage de l'app v11 (legacy/) sur Supabase.
// L'app attend l'interface du runtime des artifacts Claude :
//   db.doc(path).set(data) / .delete() / .onSnapshot(cb, onErr)
//   db.collection(path).where(champ, '>=', valeur).onSnapshot(cb, onErr)
// Chaque document est une ligne de `leon_docs` (org_id, path, data). Les
// changements faits sur un autre appareil arrivent par Supabase Realtime.

const TABLE = "leon_docs";

function storeError(error) {
  const e = new Error(error?.message || "Erreur de stockage");
  // Codes compris par l'app : 'invalid_argument' (pas le droit), 'unavailable' (elle retente).
  e.code = error?.code === "42501" ? "invalid_argument" : "unavailable";
  return e;
}

export function createLeonDb(supabase, orgId) {
  const docSubs = new Map(); // path -> Set(refresh)
  const colSubs = new Map(); // parent path -> Set(refresh)
  const timers = new Map();

  const later = (key, fn) => {
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => { timers.delete(key); fn(); }, 120));
  };

  const channel = supabase
    .channel(`leon_docs:${orgId}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `org_id=eq.${orgId}` }, (msg) => {
      const path = (msg.new && msg.new.path) || (msg.old && msg.old.path);
      if (!path) return;
      // On relit le document plutôt que d'utiliser le contenu du message :
      // les gros documents (carte, planning) peuvent dépasser la taille limite.
      (docSubs.get(path) || []).forEach((f) => later("d:" + path, f));
      const parent = path.replace(/\/[^/]+$/, "");
      (colSubs.get(parent) || []).forEach((f) => later("c:" + parent, f));
    })
    .subscribe();

  function listen(map, key, fn) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(fn);
    return () => map.get(key)?.delete(fn);
  }

  function doc(path) {
    return {
      async set(data) {
        const { error } = await supabase.from(TABLE).upsert({ org_id: orgId, path, data }, { onConflict: "org_id,path" });
        if (error) throw storeError(error);
      },
      async delete() {
        const { error } = await supabase.from(TABLE).delete().eq("org_id", orgId).eq("path", path);
        if (error) throw storeError(error);
      },
      onSnapshot(cb, onErr) {
        let live = true;
        const refresh = async () => {
          const { data, error } = await supabase.from(TABLE).select("data").eq("org_id", orgId).eq("path", path).maybeSingle();
          if (!live) return;
          if (error) return onErr && onErr(storeError(error));
          cb({ exists: !!data, data: () => (data ? data.data : undefined), metadata: { hasPendingWrites: false } });
        };
        const stop = listen(docSubs, path, refresh);
        refresh();
        return () => { live = false; stop(); };
      },
    };
  }

  function collection(path) {
    const query = (filters) => ({
      where(field, op, value) {
        if (op !== ">=") throw new Error(`where '${op}' non géré`);
        return query([...filters, [field, value]]);
      },
      onSnapshot(cb, onErr) {
        let live = true;
        const refresh = async () => {
          let q = supabase.from(TABLE).select("data").eq("org_id", orgId).eq("parent", path);
          filters.forEach(([f, v]) => { q = q.gte(`data->>${f}`, v); });
          const { data, error } = await q;
          if (!live) return;
          if (error) return onErr && onErr(storeError(error));
          cb({ docs: (data || []).map((r) => ({ data: () => r.data, metadata: { hasPendingWrites: false } })) });
        };
        const stop = listen(colSubs, path, refresh);
        refresh();
        return () => { live = false; stop(); };
      },
    });
    return query([]);
  }

  return { doc, collection, close: () => supabase.removeChannel(channel) };
}
