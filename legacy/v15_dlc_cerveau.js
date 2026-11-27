/* =========================================================
   15.11 · LE CERVEAU DES DLC (27 nov. 2026, demandé par Maurice)
   « À chaque fois qu'on rajoute un nouveau produit, Léon doit réfléchir tout seul
     à combien de jours de DLC. Le patron ajuste seulement certains produits. »
   dlcGuess(nom, zone) → { j: jours, why: raison lisible, sure: true/false }
   Règles (de la plus précise à la plus large), toujours du côté prudent :
   - DLC secondaire après préparation / ouverture, produit gardé au froid (0 à 3 °C) ;
   - jamais plus de 3 jours pour un produit frais (règle de Léon : ouverture + 3 j max) ;
   - produits à risque (haché, poisson cru, fruits de mer, œuf cru, riz cuit…) : 1 jour ;
   - congélateur : l'étiquette sert à la décongélation → 1 jour ;
   - réserve sèche / bar (sirops, alcools) : 30 jours après ouverture ;
   - produit inconnu au frais : 3 jours, marqué « à vérifier ».
   La durée réglée par le patron passe toujours avant.
   ========================================================= */
const dlcNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9%]+/g,' ').trim();
// mot entier (pluriel en s/x accepté) : « bar » ne doit pas attraper « barbecue »
const dlcRx=w=>new RegExp('(^| )('+w+')(s|x)?(?= |$)','');
const DLC_CUIT=dlcRx('cuit|cuite|cuits|cuites|roti|rotie|braise|confit|confite|grille|grillee|poche|mijote|saute|blanchi|precuit|frit|frite fraiche');
// [motif, jours, raison, sûr ?] — l'ordre compte : le premier qui colle gagne
const DLC_REGLES=[
  // ----- 1 jour : produits à risque -----
  ['hache|hachee|haches|steak hache|chair a saucisse|farce|tartare|carpaccio|ceviche|sushi|sashimi|poke|gravlax',1,'viande hachée ou produit cru préparé',true],
  ['mayo|mayonnaise|aioli|aioli|rouille|bearnaise|hollandaise|tiramisu|mousse au chocolat|mousse chocolat|chantilly|creme anglaise|creme patissiere|sabayon|oeuf cru|oeufs crus|pate a crepe|pate a crepes|appareil',1,'préparation à base d’œuf ou de crème fouettée',true],
  ['crevette|gambas|langoustine|homard|crabe|moule|moules|huitre|coquille|saint jacques|st jacques|calamar|calmar|seiche|poulpe|encornet|fruits de mer|bulot|bigorneau|palourde|coque',1,'fruits de mer et crustacés',true],
  ['riz',1,'riz cuit (risque microbien si gardé)',true],
  ['abat|foie|rognon|ris de veau|coeur|langue',1,'abats',true],
  ['salade|mesclun|roquette|jeunes pousses|pousse|mache|epinard frais|cresson|laitue|batavia|iceberg|sucrine|frisee',1,'salade et jeunes pousses lavées',true],
  ['saumon|cabillaud|thon|bar|dorade|daurade|merlu|lieu|colin|truite|sole|maquereau|sardine|poisson|lotte|eglefin|haddock|anchois frais|espadon',1,'poisson frais',true],
  // ----- produits cuits / préparés -----
  ['pate en croute|terrine|rillette|pate de campagne|pate de foie',3,'terrine ou pâté maison',true],
  ['pate a pizza|pate brisee|pate feuilletee|pate sablee|pate a pain|pate a burger|pain|brioche|bun|buns',2,'pâte et pain',true],
  ['pate|pates|spaghetti|tagliatelle|penne|gnocchi|lasagne|ravioli|semoule|quinoa|boulgour|lentille|pois chiche|haricot',2,'féculent cuit',true],
  ['puree|frite|frites|pomme de terre|pommes de terre|patate|grenaille|potatoes|gratin',2,'pommes de terre cuites ou préparées',true],
  ['tarte|gateau|cake|cheesecake|fondant|brownie|cookie|flan|panna cotta|creme brulee|creme caramel|dessert|crumble|clafoutis|riz au lait',2,'dessert maison',true],
  ['jus d orange|jus de fruit|jus de pomme|jus de citron|jus presse|smoothie|citronnade|limonade',2,'jus de fruits frais ou ouvert',true],
  ['sauce|vinaigrette|coulis|jus|fond|bouillon|soupe|veloute|potage|gaspacho|pesto|tapenade|houmous|guacamole|tzatziki|marinade|chutney|compotee|ketchup maison',3,'sauce ou préparation maison',true],
  ['plat du jour|ragout|chili|curry|blanquette|bourguignon|carbonnade|carbonade|waterzoi|waterzooi|potjevleesch|hachis|lasagnes|gratin|quiche|tourte|terrine|rillette|pate en croute|garniture|farci|farcie',3,'plat cuisiné',true],
  // ----- viandes crues (si pas cuites) -----
  ['poulet|volaille|dinde|canard|pintade|caille|lapin|magret|aiguillette|cuisse|blanc de',2,'volaille crue',true],
  ['boeuf|veau|porc|agneau|mouton|steak|rumsteck|entrecote|faux filet|bavette|onglet|joue|paleron|filet|cote|cotes|travers|ribs|echine|epaule|gigot|souris|basse cote|viande|burger',3,'viande crue en morceaux',true],
  ['jambon|bacon|lardon|lardons|saucisson|chorizo|coppa|pancetta|bresaola|rosette|salami|charcuterie|saucisse|merguez|andouillette|boudin|pastrami|pulled',3,'charcuterie ouverte ou tranchée',true],
  // ----- laitiers, œufs -----
  ['mozzarella|burrata|ricotta|mascarpone|fromage frais|faisselle|chevre frais|feta|stracciatella',2,'fromage frais',true],
  ['oeuf dur|oeufs durs|oeuf|oeufs',2,'œufs cuits / écalés',true],
  ['creme|lait|yaourt|fromage blanc|beurre|cheddar|maroilles|comte|emmental|gruyere|raclette|parmesan|reblochon|camembert|brie|roquefort|bleu|mimolette|tomme|fromage|rape|rapee',3,'produit laitier ouvert',true],
  // ----- végétaux -----
  ['bouquet garni|persil|coriandre|basilic|ciboulette|menthe|aneth|estragon|cerfeuil|thym frais|herbe|herbes',2,'herbes fraîches',true],
  ['citron|lime|orange|pamplemousse|fruit|fraise|framboise|myrtille|ananas|mangue|melon|pasteque|kiwi|pomme|poire|banane|raisin',2,'fruits coupés',true],
  ['tomate|oignon|echalote|ail|carotte|poivron|concombre|courgette|aubergine|champignon|chou|celeri|radis|betterave|avocat|poireau|fenouil|legume|legumes|crudite|crudites|cornichon|jalapeno|piment',2,'légumes taillés',true],
];
const DLC_LONGS=[
  ['sirop|liqueur|rhum|whisky|vodka|gin|pastis|vin|biere|alcool|spiritueux|cognac|porto|martini|aperol|campari|vermouth|cidre',30,'boisson alcoolisée ou sirop ouvert',true],
  ['ketchup|moutarde|sauce soja|tabasco|worcestershire|vinaigre|huile|sauce barbecue|sauce bbq|sriracha|cornichons en bocal|capres',30,'condiment en bouteille ouvert',true],
  ['glace|sorbet|creme glacee',30,'glace (bac entamé, gardé congelé)',true],
];
function dlcGuess(nom,zone){
  const n=' '+dlcNorm(nom)+' ';const t=n.trim();
  const find=L=>L.find(([w])=>dlcRx(w).test(t));
  if(!t)return {j:3,why:'pas de nom',sure:false};
  // produits longs (bar, condiments, glace) d'abord : ils ne sont pas « frais »
  const lg=find(DLC_LONGS);if(lg)return {j:lg[1],why:lg[2],sure:lg[3]};
  // congélateur : l'étiquette marque la décongélation
  if(zone==='congel')return {j:1,why:'produit décongelé (à garder au froid, ne pas recongeler)',sure:true};
  const r=find(DLC_REGLES);
  if(r){
    let [,j,why,sure]=r;
    // une viande ou une volaille cuite tient un peu mieux qu'une crue, sans dépasser 3 j
    if(DLC_CUIT.test(t)&&/viande crue|volaille crue/.test(why)){j=3;why=why.startsWith('volaille')?'volaille cuite':'viande cuite';}
    return {j:Math.min(j,3),why,sure};
  }
  if(zone==='sec'||zone==='entretien')return {j:30,why:'produit sec ou d’épicerie ouvert',sure:false};
  if(zone==='bar')return {j:3,why:'boisson fraîche ouverte',sure:false};
  return {j:3,why:'produit frais inconnu : 3 jours par prudence',sure:false};
}
