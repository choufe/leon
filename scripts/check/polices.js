// Outil de vérification (12.30) : polices du site et coupure des appels externes pendant les captures.
const fs = require('fs'); const path = require('path');
// Polices du site servies en local (sinon les captures sont en police de secours) :
// npm i --prefix <dossier> @fontsource-variable/bricolage-grotesque @fontsource-variable/instrument-sans @fontsource/ibm-plex-mono @fontsource-variable/noto-sans-tamil @fontsource-variable/noto-sans-arabic
// puis LEON_FONTS=<dossier>/node_modules npm run check
const F = process.env.LEON_FONTS || path.join(__dirname, 'fonts/node_modules');
const files = {
  'bric.woff2': '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2',
  'bricx.woff2': '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2',
  'inst.woff2': '@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2',
  'instx.woff2': '@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-standard-normal.woff2',
  'insti.woff2': '@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-italic.woff2',
  'm4.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'm5.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
  'm6.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2',
  'tam.woff2': '@fontsource-variable/noto-sans-tamil/files/noto-sans-tamil-tamil-standard-normal.woff2',
  'ara.woff2': '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-standard-normal.woff2',
};
const U = 'https://fonts.gstatic.com/local/';
const CSS = `
@font-face{font-family:'Bricolage Grotesque';font-weight:200 800;font-stretch:75% 100%;src:url(${U}bric.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Bricolage Grotesque';font-weight:200 800;src:url(${U}bricx.woff2) format('woff2');unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Instrument Sans';font-weight:400 700;src:url(${U}inst.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Instrument Sans';font-weight:400 700;src:url(${U}instx.woff2) format('woff2');unicode-range:U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Instrument Sans';font-style:italic;font-weight:400 700;src:url(${U}insti.woff2) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:400;src:url(${U}m4.woff2) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:500;src:url(${U}m5.woff2) format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-weight:600;src:url(${U}m6.woff2) format('woff2')}
@font-face{font-family:'Noto Sans Tamil';font-weight:400 700;src:url(${U}tam.woff2) format('woff2')}
@font-face{font-family:'Noto Sans Arabic';font-weight:400 700;src:url(${U}ara.woff2) format('woff2')}
`;
async function setupFonts(ctx) {
  if (!fs.existsSync(F)) { await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort()); return; }
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS, headers: {'access-control-allow-origin':'*'} }));
  await ctx.route(/fonts\.gstatic\.com\/local\//, r => {
    const k = r.request().url().split('/local/')[1];
    r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(path.join(F, files[k])), headers: {'access-control-allow-origin':'*'} });
  });
  // tout le reste d'externe (supabase…) : on coupe net pour ne pas attendre
  await ctx.route(/^https?:\/\/(?!localhost)(?!fonts\.)/, r => r.abort());
}
module.exports = { setupFonts };
