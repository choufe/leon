// npm run check [dossier] : le grand check complet (serveur lancé avec npm run dev).
// Captures dans le dossier (par défaut /tmp/leon-check), puis un résumé des problèmes trouvés.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs"); const path = require("node:path");
const out = process.argv[2] || "/tmp/leon-check";
fs.mkdirSync(out, { recursive: true });
const run = (f, args) => { try { process.stdout.write(execFileSync("node", [path.join(__dirname, f), ...args], { encoding: "utf8", timeout: 600000 })); } catch (e) { console.log("ÉCHEC", f, args.join(" "), e.message.slice(0, 300)); } };
for (const [dev, who, page] of [["pc","resto","demo"],["tel","resto","demo"],["tel","manager","demo"],["tel","salarie","demo"],["pc","reseau","demo"],["tel","reseau","demo"],["pc","patron","app"],["tel","patron","app"]]) run("ecrans.cjs", [dev, who, out, page]);
for (const dev of ["tabL","tabP","tel"]) run("tablette.cjs", [dev, out]);
console.log("Captures :", out);
