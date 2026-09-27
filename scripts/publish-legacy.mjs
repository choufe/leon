// Copie l'app v11 (legacy/) dans public/leon/ pour que Next.js la serve.
//   public/leon/app.html  ← legacy/reseau_v11.html, branchée sur Supabase via /app
//   public/leon/demo.html ← legacy/demo_v11.html, démo autonome (données dans le navigateur)
// À relancer après chaque `python3 legacy/build.py` : npm run legacy
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public/leon");
mkdirSync(out, { recursive: true });

const DEMO_URL = "DEMO_URL='https://claude.ai/artifact/PaCPmhUKabpK2Sp5F4wJMC'";

function replaceOnce(src, a, b) {
  const n = src.split(a).length - 1;
  if (n !== 1) throw new Error(`attendu 1 occurrence, trouvé ${n} : ${a}`);
  return src.replace(a, b);
}

// L'app tourne dans un cadre de /app, qui lui prête le stockage Supabase sous
// le nom `window.claude` (même interface que le runtime des artifacts Claude).
// Ouverte seule, elle renvoie vers /app pour ne pas écrire dans le navigateur.
const BRIDGE =
  "<script>(function(){var p=null;try{p=window.parent!==window&&window.parent.__leonClaude;}catch(e){}" +
  "if(p)window.claude=p;else location.replace('/app');})();</script>";

let app = readFileSync(join(root, "legacy/reseau_v11.html"), "utf8");
app = replaceOnce(app, "<head>", "<head>" + BRIDGE);
app = replaceOnce(app, DEMO_URL, "DEMO_URL='/leon/demo.html'");
writeFileSync(join(out, "app.html"), app);

let demo = readFileSync(join(root, "legacy/demo_v11.html"), "utf8");
demo = replaceOnce(demo, DEMO_URL, "DEMO_URL='/leon/demo.html'");
writeFileSync(join(out, "demo.html"), demo);

console.log("public/leon/app.html", app.length, "· public/leon/demo.html", demo.length);
