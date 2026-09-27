/* =========================================================
   V11 · UNE LANGUE PAR SALARIÉ
   Le staff choisit sa langue : son accueil, la borne, son planning,
   les plats dispo, les allergènes, le cahier et les fiches sont
   traduits. Le patron reste en français.
   Traductions à faire relire par l'équipe (surtout le tamoul).
   ========================================================= */
const LANGS=[['fr','Français'],['en','English'],['ta','தமிழ்'],['ar','العربية'],['pt','Português'],['es','Español']];
const LANG_SHORT={fr:'FR',en:'EN',ta:'தமி',ar:'عر',pt:'PT',es:'ES'};
/* [français, anglais, tamoul, arabe, portugais, espagnol] */
const I18N_ROWS=[
 ['Accueil','Home','முகப்பு','الرئيسية','Início','Inicio'],
 ['Planning','Schedule','வேலை அட்டவணை','جدول العمل','Horário','Horario'],
 ['Mon planning','My schedule','என் வேலை அட்டவணை','جدولي','O meu horário','Mi horario'],
 ['Pointage','Clock in','வருகைப் பதிவு','تسجيل الحضور','Ponto','Fichaje'],
 ['Mes heures','My hours','என் நேரம்','ساعاتي','As minhas horas','Mis horas'],
 ['Congés','Leave','விடுப்பு','الإجازات','Férias','Vacaciones'],
 ['Mes congés','My leave','என் விடுப்பு','إجازاتي','As minhas férias','Mis vacaciones'],
 ['Plats dispo','Dishes available','கிடைக்கும் உணவுகள்','الأطباق المتوفرة','Pratos disponíveis','Platos disponibles'],
 ['Allergènes','Allergens','ஒவ்வாமைப் பொருட்கள்','مسببات الحساسية','Alergénios','Alérgenos'],
 ['Cahier de liaison','Team logbook','குழு குறிப்பேடு','دفتر الفريق','Caderno da equipa','Cuaderno del equipo'],
 ['Cahier','Logbook','குறிப்பேடு','الدفتر','Caderno','Cuaderno'],
 ['Recettes','Recipes','சமையல் குறிப்புகள்','الوصفات','Receitas','Recetas'],
 ['Fiches','Recipes','சமையல் குறிப்புகள்','الوصفات','Fichas','Fichas'],
 ['Fiches techniques','Recipe cards','சமையல் அட்டைகள்','بطاقات الوصفات','Fichas técnicas','Fichas técnicas'],
 ['Hygiène','Hygiene','சுகாதாரம்','النظافة','Higiene','Higiene'],
 ['Hygiène & traçabilité','Hygiene','சுகாதாரம்','النظافة','Higiene','Higiene'],
 ['Mes tâches','My tasks','என் வேலைகள்','مهامي','As minhas tarefas','Mis tareas'],
 ['Ma semaine','My week','என் வாரம்','أسبوعي','A minha semana','Mi semana'],
 ['Infos de l’équipe','Team news','குழு செய்திகள்','أخبار الفريق','Notícias da equipa','Noticias del equipo'],
 ['Plus','More','மேலும்','المزيد','Mais','Más'],
 ['Espaces','Spaces','பகுதிகள்','الأقسام','Espaços','Espacios'],
 ['Tes espaces','Your spaces','உன் பகுதிகள்','أقسامك','Os teus espaços','Tus espacios'],
 ['Autres espaces','Other spaces','மற்ற பகுதிகள்','أقسام أخرى','Outros espaços','Otros espacios'],
 ['Espace','Space','பகுதி','القسم','Espaço','Espacio'],
 ['Service','Service','சேவை','الخدمة','Serviço','Servicio'],
 ['Équipe','Team','குழு','الفريق','Equipa','Equipo'],
 ['Cuisine & stocks','Kitchen & stock','சமையலறை & இருப்பு','المطبخ والمخزون','Cozinha e stock','Cocina y stock'],
 ['Verrouiller','Lock','பூட்டு','قفل','Bloquear','Bloquear'],
 ['Demander à Léon','Ask Léon','லியோனிடம் கேள்','اسأل ليون','Perguntar ao Léon','Preguntar a Léon'],
 ['Réduire','Collapse','சுருக்கு','طي','Fechar','Plegar'],
 ['Déplier','Expand','விரி','توسيع','Abrir','Desplegar'],
 ['Fermer','Close','மூடு','إغلاق','Fechar','Cerrar'],
 ['Retour','Back','பின்','رجوع','Voltar','Volver'],
 ['Annuler','Cancel','ரத்து','إلغاء','Cancelar','Cancelar'],
 ['Enregistrer','Save','சேமி','حفظ','Guardar','Guardar'],
 ['Envoyer','Send','அனுப்பு','إرسال','Enviar','Enviar'],
 ['Effacer','Clear','அழி','مسح','Apagar','Borrar'],
 ['Terminé','Done','முடிந்தது','تم','Terminado','Terminado'],
 ['OK','OK','சரி','حسنًا','OK','OK'],
 ['Tout','All','அனைத்தும்','الكل','Tudo','Todo'],
 ['Chercher','Search','தேடு','بحث','Procurar','Buscar'],
 ['Nouveau','New','புதியது','جديد','Novo','Nuevo'],
 ['Voir les autres','See the others','மற்றவற்றைப் பார்','عرض الباقي','Ver os outros','Ver los demás'],
 /* borne et pointage */
 ['Pointer mon arrivée','Clock in','வருகையைப் பதிவு செய்','تسجيل الوصول','Registar entrada','Fichar entrada'],
 ['Commencer ma pause','Start my break','இடைவேளை தொடங்கு','بدء الاستراحة','Começar a pausa','Empezar descanso'],
 ['Reprendre le service','Back to work','மீண்டும் வேலைக்கு','العودة إلى العمل','Voltar ao serviço','Volver al servicio'],
 ['Pointer mon départ','Clock out','வெளியேறுதலைப் பதிவு செய்','تسجيل المغادرة','Registar saída','Fichar salida'],
 ['Arrivée','Arrival','வருகை','الوصول','Entrada','Entrada'],
 ['Départ','Leaving','வெளியேறுதல்','المغادرة','Saída','Salida'],
 ['Pause','Break','இடைவேளை','استراحة','Pausa','Descanso'],
 ['Fin de pause','End of break','இடைவேளை முடிவு','نهاية الاستراحة','Fim da pausa','Fin del descanso'],
 ['Arrivée enregistrée','Arrival saved','வருகை பதிவானது','تم تسجيل الوصول','Entrada registada','Entrada registrada'],
 ['Départ enregistré','Departure saved','வெளியேறுதல் பதிவானது','تم تسجيل المغادرة','Saída registada','Salida registrada'],
 ['Pause commencée','Break started','இடைவேளை தொடங்கியது','بدأت الاستراحة','Pausa iniciada','Descanso iniciado'],
 ['Pause terminée','Break over','இடைவேளை முடிந்தது','انتهت الاستراحة','Pausa terminada','Descanso terminado'],
 ['Ton service aujourd’hui','Your shift today','இன்று உன் வேலை','دوامك اليوم','O teu turno hoje','Tu turno hoy'],
 ['Pas de service prévu','No shift planned','வேலை எதுவும் இல்லை','لا دوام مقرر','Sem turno previsto','Sin turno previsto'],
 ['Pas de service prévu aujourd’hui','No shift planned today','இன்று வேலை இல்லை','لا دوام اليوم','Sem turno hoje','Sin turno hoy'],
 ['Coupure','Split shift','பிரிந்த வேலை நேரம்','دوام مقسّم','Turno partido','Turno partido'],
 ['Service continu','Straight shift','தொடர் வேலை நேரம்','دوام متواصل','Turno contínuo','Turno continuo'],
 ['Tu confirmes avec ton code','Confirm with your code','உன் குறியீட்டால் உறுதி செய்','أكّد برمزك','Confirma com o teu código','Confirma con tu código'],
 ['Tape ton code','Enter your code','உன் குறியீட்டை அழுத்து','أدخل رمزك','Escreve o teu código','Escribe tu código'],
 ['Pour pointer ou ouvrir ton espace.','To clock in or open your space.','பதிவு செய்ய அல்லது உன் பக்கத்தைத் திறக்க.','للتسجيل أو فتح صفحتك.','Para registar ou abrir o teu espaço.','Para fichar o abrir tu espacio.'],
 ['Qui es-tu ?','Who are you?','நீ யார்?','من أنت؟','Quem és tu?','¿Quién eres?'],
 ['Touche ta photo','Tap your photo','உன் படத்தைத் தொடு','المس صورتك','Toca na tua foto','Toca tu foto'],
 ['Autre personne','Someone else','வேறு ஒருவர்','شخص آخر','Outra pessoa','Otra persona'],
 ['Ouvrir mon espace','Open my space','என் பக்கத்தைத் திற','افتح صفحتي','Abrir o meu espaço','Abrir mi espacio'],
 ['Bonjour','Hello','வணக்கம்','مرحبا','Olá','Hola'],
 ['Bonne pause','Enjoy your break','நல்ல இடைவேளை','استراحة طيبة','Boa pausa','Buen descanso'],
 ['Bon retour','Welcome back','மீண்டும் வருக','مرحبا بعودتك','Bom regresso','Bienvenido de nuevo'],
 ['À demain','See you tomorrow','நாளை சந்திப்போம்','إلى الغد','Até amanhã','Hasta mañana'],
 ['Merci, à bientôt','Thanks, see you soon','நன்றி, மீண்டும் சந்திப்போம்','شكرًا، إلى اللقاء','Obrigado, até breve','Gracias, hasta pronto'],
 ['À l’heure. Bon service !','On time. Have a good shift!','நேரத்துக்கு வந்தாய். நல்ல வேலை!','في الوقت. عمل موفق!','A horas. Bom serviço!','A tiempo. ¡Buen servicio!'],
 ['Tu finis à','You finish at','நீ முடிக்கும் நேரம்','تنتهي في','Acabas às','Terminas a las'],
 ['Tu reprends à','You start again at','மீண்டும் தொடங்கும் நேரம்','تعود في','Voltas às','Vuelves a las'],
 ['Ce n’est pas ton code.','That is not your code.','இது உன் குறியீடு அல்ல.','هذا ليس رمزك.','Não é o teu código.','No es tu código.'],
 ['Code inconnu.','Unknown code.','தெரியாத குறியீடு.','رمز غير معروف.','Código desconhecido.','Código desconocido.'],
 ['Prévus maintenant','Working now','இப்போது வேலையில்','يعملون الآن','Agora em serviço','Ahora en turno'],
 ['en retard','late','தாமதம்','متأخر','atrasado','tarde'],
 ['travaillées aujourd’hui','worked today','இன்று வேலை செய்தது','عملت اليوم','trabalhadas hoje','trabajadas hoy'],
 ['Pas de shift prévu à cette heure : ton responsable validera ces heures.','No shift planned now: your manager will check these hours.','இந்த நேரத்தில் வேலை திட்டமிடவில்லை: உன் மேலாளர் சரிபார்ப்பார்.','لا دوام مقرر الآن: سيتحقق المسؤول من هذه الساعات.','Sem turno previsto agora: o teu responsável vai validar.','Sin turno previsto ahora: tu responsable validará estas horas.'],
 /* présences */
 ['Présent','Here','இருக்கிறார்','حاضر','Presente','Presente'],
 ['En pause','On break','இடைவேளையில்','في استراحة','Em pausa','En descanso'],
 ['Repos','Day off','ஓய்வு','راحة','Folga','Descanso'],
 ['Parti','Left','சென்றுவிட்டார்','غادر','Saiu','Se fue'],
 ['Non pointé','Not clocked in','பதிவு செய்யவில்லை','لم يسجّل','Sem registo','Sin fichar'],
 ['En retard','Late','தாமதம்','متأخر','Atrasado','Tarde'],
 ['Attendu','Expected','எதிர்பார்க்கப்படுகிறார்','منتظر','Esperado','Esperado'],
 ['En coupure','Split break','இடைவேளை நேரம்','فترة توقف','Em intervalo','En pausa larga'],
 ['À venir','Coming up','வரவிருக்கிறது','قادم','A seguir','Próximo'],
 ['Fermé','Closed','மூடப்பட்டது','مغلق','Fechado','Cerrado'],
 ['Service du midi en cours','Lunch service now','மதிய சேவை நடக்கிறது','خدمة الغداء جارية','Almoço a decorrer','Servicio de mediodía en curso'],
 ['Service du soir en cours','Dinner service now','இரவு சேவை நடக்கிறது','خدمة العشاء جارية','Jantar a decorrer','Servicio de noche en curso'],
 ['Fin de service','End of service','சேவை முடிந்தது','انتهت الخدمة','Fim do serviço','Fin del servicio'],
 ['Fermé aujourd’hui','Closed today','இன்று மூடப்பட்டுள்ளது','مغلق اليوم','Fechado hoje','Cerrado hoy'],
 ['Aujourd’hui','Today','இன்று','اليوم','Hoje','Hoy'],
 ['Demain','Tomorrow','நாளை','غدًا','Amanhã','Mañana'],
 ['Hier','Yesterday','நேற்று','أمس','Ontem','Ayer'],
 /* jours */
 ['Lundi','Monday','திங்கள்','الاثنين','Segunda','Lunes'],['Mardi','Tuesday','செவ்வாய்','الثلاثاء','Terça','Martes'],['Mercredi','Wednesday','புதன்','الأربعاء','Quarta','Miércoles'],['Jeudi','Thursday','வியாழன்','الخميس','Quinta','Jueves'],['Vendredi','Friday','வெள்ளி','الجمعة','Sexta','Viernes'],['Samedi','Saturday','சனி','السبت','Sábado','Sábado'],['Dimanche','Sunday','ஞாயிறு','الأحد','Domingo','Domingo'],
 ['Lun','Mon','திங்','إثن','Seg','Lun'],['Mar','Tue','செவ்','ثلا','Ter','Mar'],['Mer','Wed','புத','أرب','Qua','Mié'],['Jeu','Thu','வியா','خمي','Qui','Jue'],['Ven','Fri','வெள்','جمع','Sex','Vie'],['Sam','Sat','சனி','سبت','Sáb','Sáb'],['Dim','Sun','ஞாயி','أحد','Dom','Dom'],
 /* postes */
 ['Salle','Floor','பரிமாறல்','الصالة','Sala','Sala'],['Cuisine','Kitchen','சமையலறை','المطبخ','Cozinha','Cocina'],['Bar','Bar','பார்','البار','Bar','Barra'],['Plonge','Dishwashing','பாத்திரம் கழுவுதல்','غسل الأطباق','Copa','Friegaplatos'],['Management','Management','நிர்வாகம்','الإدارة','Gestão','Gerencia'],
 /* plats dispo */
 ['Épuisé','Sold out','தீர்ந்துவிட்டது','نفد','Esgotado','Agotado'],
 ['Épuisés','Sold out','தீர்ந்தவை','نفدت','Esgotados','Agotados'],
 ['Bientôt épuisé','Almost sold out','விரைவில் தீரும்','على وشك النفاد','Quase esgotado','Casi agotado'],
 ['Bientôt','Almost out','விரைவில்','قريبًا','Quase','Casi'],
 ['Épuisé ou presque','Sold out or almost','தீர்ந்தது அல்லது கிட்டத்தட்ட','نفد أو يكاد','Esgotado ou quase','Agotado o casi'],
 ['restants','left','மீதம்','متبقٍ','restantes','quedan'],
 ['Pas de limite','No limit','வரம்பு இல்லை','بلا حد','Sem limite','Sin límite'],
 ['Remettre','Put back','மீண்டும் சேர்','إعادة','Repor','Reponer'],
 ['Un de moins','One less','ஒன்று குறை','واحد أقل','Menos um','Uno menos'],
 ['Un de plus','One more','ஒன்று கூட்டு','واحد أكثر','Mais um','Uno más'],
 ['Dispo','Available','கிடைக்கும்','متوفر','Disponível','Disponible'],
 ['Plats','Mains','முதன்மை உணவுகள்','الأطباق الرئيسية','Pratos','Platos'],
 ['Entrées','Starters','தொடக்க உணவுகள்','المقبلات','Entradas','Entrantes'],
 ['Desserts','Desserts','இனிப்புகள்','الحلويات','Sobremesas','Postres'],
 ['Boissons','Drinks','பானங்கள்','المشروبات','Bebidas','Bebidas'],
 ['Touche « Épuisé » quand il n’y en a plus : toute l’équipe le voit tout de suite.','Tap “Sold out” when there is none left: the whole team sees it right away.','இனி இல்லையென்றால் « தீர்ந்துவிட்டது » என்பதைத் தொடு: குழு முழுவதும் உடனே பார்க்கும்.','المس «نفد» عندما لا يبقى شيء: يراه كل الفريق فورًا.','Toca em «Esgotado» quando acabar: toda a equipa vê logo.','Toca «Agotado» cuando no quede: todo el equipo lo ve al momento.'],
 /* allergènes */
 ['Gluten','Gluten','பசையம் (கோதுமை)','الغلوتين','Glúten','Gluten'],
 ['Crustacés','Crustaceans','இறால், நண்டு','القشريات','Crustáceos','Crustáceos'],
 ['Œufs','Eggs','முட்டை','البيض','Ovos','Huevos'],
 ['Poissons','Fish','மீன்','الأسماك','Peixe','Pescado'],
 ['Arachides','Peanuts','வேர்க்கடலை','الفول السوداني','Amendoins','Cacahuetes'],
 ['Soja','Soy','சோயா','الصويا','Soja','Soja'],
 ['Lait','Milk','பால்','الحليب','Leite','Leche'],
 ['Fruits à coque','Tree nuts','கொட்டைகள் (பாதாம், முந்திரி)','المكسرات','Frutos de casca rija','Frutos de cáscara'],
 ['Céleri','Celery','செலரி','الكرفس','Aipo','Apio'],
 ['Moutarde','Mustard','கடுகு','الخردل','Mostarda','Mostaza'],
 ['Sésame','Sesame','எள்','السمسم','Sésamo','Sésamo'],
 ['Sulfites','Sulphites','சல்ஃபைட்','الكبريتيت','Sulfitos','Sulfitos'],
 ['Lupin','Lupin','லூபின்','الترمس','Tremoço','Altramuz'],
 ['Mollusques','Molluscs','மட்டி, கணவாய்','الرخويات','Moluscos','Moluscos'],
 ['Le client est allergique à…','The customer is allergic to…','வாடிக்கையாளருக்கு ஒவ்வாமை…','الزبون لديه حساسية من…','O cliente é alérgico a…','El cliente es alérgico a…'],
 ['Touche un ou plusieurs allergènes.','Tap one or more allergens.','ஒன்று அல்லது அதற்கு மேற்பட்ட ஒவ்வாமைகளைத் தொடு.','المس مسببًا واحدًا أو أكثر.','Toca num ou mais alergénios.','Toca uno o varios alérgenos.'],
 ['Sans risque','Safe','பாதுகாப்பானது','آمن','Sem risco','Sin riesgo'],
 ['À éviter','Avoid','தவிர்க்கவும்','تجنّب','Evitar','Evitar'],
 ['Contient','Contains','உள்ளது','يحتوي على','Contém','Contiene'],
 ['En cas de doute, demande en cuisine.','If in doubt, ask the kitchen.','சந்தேகம் இருந்தால் சமையலறையில் கேள்.','إذا شككت، اسأل المطبخ.','Em caso de dúvida, pergunta na cozinha.','Si tienes dudas, pregunta en cocina.'],
 ['Aucun des 14 allergènes réglementaires.','None of the 14 regulated allergens.','14 ஒவ்வாமைப் பொருட்களில் எதுவும் இல்லை.','لا يحتوي على أي من مسببات الحساسية الـ14.','Nenhum dos 14 alergénios.','Ninguno de los 14 alérgenos.'],
 /* cahier de liaison */
 ['Rupture','Out of stock','பொருள் தீர்ந்தது','نفاد','Rutura','Rotura de stock'],
 ['Casse / perte','Breakage / waste','உடைப்பு / வீண்','كسر / هدر','Quebra / perda','Rotura / pérdida'],
 ['Client','Customer','வாடிக்கையாளர்','زبون','Cliente','Cliente'],
 ['Livraison','Delivery','விநியோகம்','توصيل','Entrega','Entrega'],
 ['À faire','To do','செய்ய வேண்டியது','للقيام به','A fazer','Por hacer'],
 ['Info','Info','தகவல்','معلومة','Info','Info'],
 ['J’ai lu','I read it','படித்தேன்','قرأت','Li','Leído'],
 ['Lu','Read','படித்தது','مقروء','Lido','Leído'],
 ['Traduire','Translate','மொழிபெயர்','ترجم','Traduzir','Traducir'],
 ['Écrire dans le cahier','Write in the logbook','குறிப்பேட்டில் எழுது','اكتب في الدفتر','Escrever no caderno','Escribir en el cuaderno'],
 ['Fait','Done','முடிந்தது','تم','Feito','Hecho'],
 ['Ouvrir le cahier','Open logbook','குறிப்பேட்டைத் திற','افتح الدفتر','Abrir o caderno','Abrir el cuaderno'],
 ['Épinglé','Pinned','முக்கியம்','مثبّت','Fixado','Fijado'],
 ['Rien de nouveau.','Nothing new.','புதிதாக எதுவும் இல்லை.','لا جديد.','Nada de novo.','Nada nuevo.'],
 ['Midi','Lunch','மதியம்','الغداء','Almoço','Mediodía'],
 ['Soir','Evening','இரவு','المساء','Jantar','Noche'],
 ['Qu’est-ce qui se passe ?','What happened?','என்ன நடந்தது?','ماذا حدث؟','O que aconteceu?','¿Qué ha pasado?'],
 /* tâches */
 ['Ouverture','Opening','திறப்பு','الافتتاح','Abertura','Apertura'],
 ['Fermeture','Closing','மூடுதல்','الإغلاق','Fecho','Cierre'],
 ['Pendant le service','During service','சேவையின் போது','أثناء الخدمة','Durante o serviço','Durante el servicio'],
 ['avant','before','முன்','قبل','antes das','antes de las'],
 ['Tout est fait','All done','எல்லாம் முடிந்தது','كل شيء تم','Tudo feito','Todo hecho'],
 ['Rien à faire pour toi aujourd’hui.','Nothing for you to do today.','இன்று உனக்கு வேலை எதுவும் இல்லை.','لا شيء عليك اليوم.','Nada para fazer hoje.','Nada que hacer hoy.'],
 ['Relever les températures','Check the temperatures','வெப்பநிலையைப் பதிவு செய்','سجّل درجات الحرارة','Registar temperaturas','Anotar temperaturas'],
 ['Hors norme','Out of range','வரம்புக்கு வெளியே','خارج النطاق','Fora do limite','Fuera de rango'],
 ['Relevé du jour','Today’s readings','இன்றைய பதிவு','قراءات اليوم','Registo do dia','Registro del día'],
 ['Enregistrer les relevés','Save readings','பதிவுகளைச் சேமி','حفظ القراءات','Guardar registos','Guardar registros'],
 ['Pas encore relevé','Not checked yet','இன்னும் பதிவு செய்யவில்லை','لم يُسجل بعد','Ainda não registado','Aún no registrado'],
 ['Qu’est-ce que tu as fait ?','What did you do?','நீ என்ன செய்தாய்?','ماذا فعلت؟','O que fizeste?','¿Qué has hecho?'],
 /* mon planning, mes congés */
 ['Prochain service','Next shift','அடுத்த வேலை','الدوام القادم','Próximo turno','Próximo turno'],
 ['Échanger','Swap','மாற்று','تبديل','Trocar','Cambiar'],
 ['Mes disponibilités','My availability','நான் கிடைக்கும் நேரம்','أوقات توفري','As minhas disponibilidades','Mi disponibilidad'],
 ['Demander un congé','Request leave','விடுப்பு கேள்','طلب إجازة','Pedir férias','Pedir vacaciones'],
 ['Ce qui a changé','What changed','மாறியவை','ما الذي تغيّر','O que mudou','Qué ha cambiado'],
 ['Voir le planning de toute l’équipe','See the whole team’s schedule','முழு குழுவின் அட்டவணை','جدول كل الفريق','Ver o horário da equipa','Ver el horario del equipo'],
 ['Shifts à pourvoir','Open shifts','நிரப்ப வேண்டிய வேலைகள்','مناوبات شاغرة','Turnos em aberto','Turnos libres'],
 ['Je suis dispo','I’m available','நான் வர முடியும்','أنا متاح','Estou disponível','Estoy disponible'],
 ['Mes demandes','My requests','என் கோரிக்கைகள்','طلباتي','Os meus pedidos','Mis solicitudes'],
 ['Acceptée','Accepted','ஏற்கப்பட்டது','مقبول','Aceite','Aceptada'],
 ['Refusée','Refused','மறுக்கப்பட்டது','مرفوض','Recusada','Rechazada'],
 ['En attente','Pending','காத்திருக்கிறது','قيد الانتظار','Pendente','Pendiente'],
 ['Tes services, tes congés, et les shifts où l’équipe a besoin de toi.','Your shifts, your leave, and the shifts where the team needs you.','உன் வேலை நேரங்கள், விடுப்புகள், குழுவுக்கு நீ தேவைப்படும் நேரங்கள்.','دواماتك وإجازاتك والمناوبات التي يحتاجك فيها الفريق.','Os teus turnos, as tuas férias e os turnos onde a equipa precisa de ti.','Tus turnos, tus vacaciones y los turnos donde el equipo te necesita.'],
 ['Rien de prévu pour l’instant','Nothing planned yet','இப்போதைக்கு எதுவும் இல்லை','لا شيء مقرر حاليًا','Nada previsto por agora','Nada previsto por ahora'],
 ['Le prochain planning arrive dès qu’il est publié.','The next schedule arrives as soon as it is published.','அடுத்த அட்டவணை வெளியானதும் வரும்.','سيصل الجدول القادم فور نشره.','O próximo horário chega quando for publicado.','El próximo horario llega en cuanto se publique.'],
 ['Planning pas encore publié.','Schedule not published yet.','அட்டவணை இன்னும் வெளியிடப்படவில்லை.','لم يُنشر الجدول بعد.','Horário ainda não publicado.','Horario aún no publicado.'],
 ['Ton solde, tes demandes et tes absences à venir.','Your balance, your requests and your upcoming absences.','உன் இருப்பு, கோரிக்கைகள், வரவிருக்கும் விடுப்புகள்.','رصيدك وطلباتك وغياباتك القادمة.','O teu saldo, pedidos e próximas ausências.','Tu saldo, solicitudes y próximas ausencias.'],
 ['Solde de congés','Leave balance','விடுப்பு இருப்பு','رصيد الإجازات','Saldo de férias','Saldo de vacaciones'],
 ['Demandes en cours','Pending requests','நிலுவையில் உள்ள கோரிக்கைகள்','طلبات قيد المعالجة','Pedidos em curso','Solicitudes en curso'],
 ['Mes absences à venir','My upcoming absences','என் வரவிருக்கும் விடுப்புகள்','غياباتي القادمة','As minhas próximas ausências','Mis próximas ausencias'],
 ['Congés payés','Paid leave','ஊதிய விடுப்பு','إجازة مدفوعة','Férias pagas','Vacaciones pagadas'],
 ['Arrêt maladie','Sick leave','மருத்துவ விடுப்பு','إجازة مرضية','Baixa médica','Baja médica'],
 ['Indisponible','Unavailable','கிடைக்காது','غير متاح','Indisponível','No disponible'],
 ['Formation','Training','பயிற்சி','تدريب','Formação','Formación'],
 ['Tes 7 derniers jours','Your last 7 days','உன் கடைசி 7 நாட்கள்','آخر 7 أيام','Os teus últimos 7 dias','Tus últimos 7 días'],
 ['Pointe en arrivant, en partant et pour tes pauses. Tu retapes ton code à chaque fois : personne ne peut pointer à ta place.','Clock in when you arrive, leave and take a break. You type your code each time: nobody can clock in for you.','வரும்போதும், போகும்போதும், இடைவேளைக்கும் பதிவு செய். ஒவ்வொரு முறையும் உன் குறியீட்டை அழுத்து: வேறு யாரும் உனக்காகப் பதிவு செய்ய முடியாது.','سجّل عند الوصول والمغادرة والاستراحة. تدخل رمزك كل مرة: لا أحد يستطيع التسجيل مكانك.','Regista quando chegas, sais e fazes pausa. Escreves o teu código sempre: ninguém pode registar por ti.','Ficha al llegar, al salir y en tus descansos. Escribes tu código cada vez: nadie puede fichar por ti.'],
 ['Jour','Day','நாள்','اليوم','Dia','Día'],['Prévu','Planned','திட்டம்','المخطط','Previsto','Previsto'],['Pointé','Clocked','பதிவு','المسجّل','Registado','Fichado'],['Réel','Actual','உண்மை','الفعلي','Real','Real'],['Écart','Difference','வேறுபாடு','الفرق','Diferença','Diferencia'],
 /* fiches en mode cuisine */
 ['Ingrédients','Ingredients','பொருட்கள்','المكونات','Ingredientes','Ingredientes'],
 ['Étapes','Steps','படிகள்','الخطوات','Passos','Pasos'],
 ['pour 1 portion','for 1 portion','1 பங்குக்கு','لحصة واحدة','para 1 dose','para 1 ración'],
 ['1 portion','1 portion','1 பங்கு','حصة واحدة','1 dose','1 ración'],
 ['Recette complète','Full recipe','முழு செய்முறை','الوصفة كاملة','Receita completa','Receta completa'],
 ['Plein écran','Full screen','முழுத் திரை','ملء الشاشة','Ecrã inteiro','Pantalla completa'],
 ['Toutes les fiches','All recipes','எல்லா குறிப்புகளும்','كل الوصفات','Todas as fichas','Todas las fichas'],
 ['Préparation maison','House-made prep','வீட்டுத் தயாரிப்பு','تحضير منزلي','Preparação da casa','Preparación casera'],
 ['Pas d’étapes renseignées.','No steps written yet.','படிகள் எழுதப்படவில்லை.','لم تُكتب خطوات بعد.','Sem passos escritos.','Sin pasos escritos.'],
 ['Mode cuisine','Kitchen mode','சமையலறை முறை','وضع المطبخ','Modo cozinha','Modo cocina'],
 /* accueil du staff */
 ['Ajouter ma photo','Add my photo','என் படத்தைச் சேர்','أضف صورتي','Adicionar a minha foto','Añadir mi foto'],
 ['Langue','Language','மொழி','اللغة','Idioma','Idioma'],
 ['Choisis ta langue','Choose your language','உன் மொழியைத் தேர்ந்தெடு','اختر لغتك','Escolhe a tua língua','Elige tu idioma'],
 ['Ton responsable écrit en français : touche « Traduire » sous un message pour le lire dans ta langue.','Your manager writes in French: tap “Translate” under a message to read it in your language.','உன் மேலாளர் பிரெஞ்சில் எழுதுவார்: உன் மொழியில் படிக்க செய்தியின் கீழ் « மொழிபெயர் » என்பதைத் தொடு.','يكتب مسؤولك بالفرنسية: المس «ترجم» تحت الرسالة لقراءتها بلغتك.','O teu responsável escreve em francês: toca em «Traduzir» para ler na tua língua.','Tu responsable escribe en francés: toca «Traducir» bajo un mensaje para leerlo en tu idioma.'],
 ['Semaine','Week','வாரம்','أسبوع','Semana','Semana'],
 ['Semaine précédente','Previous week','முந்தைய வாரம்','الأسبوع السابق','Semana anterior','Semana anterior'],
 ['Semaine suivante','Next week','அடுத்த வாரம்','الأسبوع القادم','Semana seguinte','Semana siguiente'],
 ['Pas encore publié','Not published yet','இன்னும் வெளியிடப்படவில்லை','لم يُنشر بعد','Ainda não publicado','Aún no publicado'],
];
const I18N={};
LANGS.forEach(([k],i)=>{if(i)I18N[k]={};});
I18N_ROWS.forEach(r=>{LANGS.forEach(([k],i)=>{if(i&&r[i]){I18N[k][r[0]]=r[i];const alt=r[0].replace(/’/g,"'");if(alt!==r[0])I18N[k][alt]=r[i];}});});
const I18N_PAT=[
 [/^Salut (.+)$/,{en:'Hi $1',ta:'வணக்கம் $1',ar:'مرحبا $1',pt:'Olá $1',es:'Hola $1'}],
 [/^Service du midi dans (.+)$/,{en:'Lunch service in $1',ta:'மதிய சேவை: இன்னும் $1',ar:'خدمة الغداء بعد $1',pt:'Almoço dentro de $1',es:'Servicio de mediodía en $1'}],
 [/^Service du soir dans (.+)$/,{en:'Dinner service in $1',ta:'இரவு சேவை: இன்னும் $1',ar:'خدمة العشاء بعد $1',pt:'Jantar dentro de $1',es:'Servicio de noche en $1'}],
 [/^depuis (.+)$/,{en:'since $1',ta:'$1 முதல்',ar:'منذ $1',pt:'desde $1',es:'desde $1'}],
 [/^prévu (.+)$/,{en:'planned $1',ta:'திட்டம் $1',ar:'مقرر $1',pt:'previsto $1',es:'previsto $1'}],
 [/^à (\d.*)$/,{en:'at $1',ta:'$1 மணிக்கு',ar:'الساعة $1',pt:'às $1',es:'a las $1'}],
 [/^reprend à (.+)$/,{en:'back at $1',ta:'$1 மணிக்கு மீண்டும்',ar:'يعود الساعة $1',pt:'volta às $1',es:'vuelve a las $1'}],
 [/^service (\d.+)$/,{en:'shift $1',ta:'வேலை $1',ar:'دوام $1',pt:'turno $1',es:'turno $1'}],
 [/^(.+) de retard$/,{en:'$1 late',ta:'$1 தாமதம்',ar:'تأخير $1',pt:'$1 de atraso',es:'$1 de retraso'}],
 [/^(.+) faites$/,{en:'$1 done',ta:'$1 முடிந்தது',ar:'$1 منجزة',pt:'$1 feitas',es:'$1 hechas'}],
 [/^Prise de poste dans (.+)$/,{en:'Starting in $1',ta:'இன்னும் $1-ல் வேலை',ar:'تبدأ بعد $1',pt:'Começas dentro de $1',es:'Empiezas en $1'}],
 [/^Prise de poste prévue à (.+)$/,{en:'Starting at $1',ta:'$1 மணிக்கு வேலை',ar:'تبدأ الساعة $1',pt:'Começas às $1',es:'Empiezas a las $1'}],
 [/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche|Lun|Mar|Mer|Jeu|Ven|Sam|Dim)( .+)$/,null],
];
let LANG='fr';
function T(s){if(LANG==='fr'||s==null)return s;const d=I18N[LANG];return (d&&d[s])||s;}
function trSeg(s){
  const d=I18N[LANG];if(!d)return null;if(d[s])return d[s];
  for(const [re,m] of I18N_PAT){
    const x=s.match(re);if(!x)continue;
    if(!m){const w=d[x[1]];return w?w+x[2]:null;}
    return m[LANG]?m[LANG].replace(/\$(\d)/g,(_,i)=>{const v=x[+i]||'';return d[v]||v;}):null;
  }
  return null;
}
function trText(t){
  const core=t.trim();if(!core||core.length>260)return null;
  let r=trSeg(core);
  if(r==null&&core.includes(' · ')){const parts=core.split(' · ');const out=parts.map(p=>trSeg(p.trim())||p);if(out.some((x,i)=>x!==parts[i]))r=out.join(' · ');}
  if(r==null)return null;
  const lead=t.match(/^\s*/)[0],trail=t.match(/\s*$/)[0];return lead+r+trail;
}
function i18nDom(root){
  if(LANG==='fr'||!root)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest('script,style,textarea,[data-noi18n]'))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
  const list=[];let n;while((n=w.nextNode()))list.push(n);
  list.forEach(nd=>{const r=trText(nd.nodeValue);if(r!=null&&r!==nd.nodeValue)nd.nodeValue=r;});
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{if(el.closest('[data-noi18n]'))return;['placeholder','aria-label','title'].forEach(a=>{const v=el.getAttribute(a);if(!v)return;const r=trText(v);if(r!=null&&r!==v)el.setAttribute(a,r);});});
}
const BORNE={who:null,act:null};
function empLang(id){const e=id&&EMP.find(x=>x.id===id);return (e&&e.lang)||'fr';}
function langNow(){
  if(U.screen==='lock'&&BORNE.who)return empLang(BORNE.who);
  if(U.screen==='badge'&&U.empId)return empLang(U.empId);
  if(U.screen==='app'&&S&&U.empId&&!U.viewAs&&(effRole()==='staff'||effRole()==='manager'))return empLang(U.empId);
  return 'fr';
}
function applyLang(){
  const l=langNow();LANG=I18N[l]||l==='fr'?l:'fr';
  try{document.documentElement.lang=LANG;document.body.classList.toggle('lang-ar',LANG==='ar');document.body.classList.toggle('lang-ta',LANG==='ta');}catch(e){}
}
function i18nAll(){if(LANG==='fr')return;['app','modal-root','chat-root','qe-root','menu-root'].forEach(id=>{const el=document.getElementById(id);if(el)i18nDom(el);});}
{const f=render;render=function(){applyLang();const r=f.apply(this,arguments);i18nAll();return r;};}
{const f=renderView;renderView=function(){applyLang();const r=f.apply(this,arguments);i18nAll();return r;};}
{const f=mcardify;mcardify=function(){f();try{i18nAll();}catch(e){}};}
{const f=toast;toast=function(msg,...a){return f(T(msg),...a);};}
{const f=svcLabel;svcLabel=function(){return f();};}

/* ---------- choisir sa langue ---------- */
function langModal(empId){
  const cur=empLang(empId);const e=empById(empId);const self=empId===U.empId;
  openModal(`<div class="mh"><div><h3>${ic('globe')} ${self?T('Choisis ta langue'):'Langue de '+esc(e.prenom)}</h3><p>${self?'':'Son accueil, la borne, son planning, les plats dispo, les allergènes et les fiches s’affichent dans cette langue.'}</p></div><button class="icon-btn" data-act="modal-close" aria-label="${T('Fermer')}">${ic('x')}</button></div>
   <div class="lang-grid">${LANGS.map(([k,n])=>`<button class="lang-b ${k===cur?'on':''}" data-act="lang-set" data-l="${k}" data-id="${esc(empId)}" lang="${k}"><b>${n}</b>${k===cur?ic('check','s'):''}</button>`).join('')}</div>
   <p class="faint" style="font-size:12.5px;margin-top:12px">Traductions faites par Léon : fais-les relire par l’équipe. Les messages écrits par le responsable restent en français, avec un bouton « Traduire ».</p>`,'narrow');
}
Object.assign(ACT,{
  'lang-open'(t){langModal(t.dataset.id||U.empId);},
  'lang-set'(t){
    const id=t.dataset.id;const l=t.dataset.l;if(!id)return;
    S.emp=S.emp.map(o=>o.id===id?{...o,lang:l==='fr'?undefined:l}:o);syncCtx();save();closeModal();
    if(U.screen==='app')renderView();else render();
    toast(id===U.empId?'OK':'Langue enregistrée','globe');
  },
});

/* ---------- traduire un message avec Léon (appel à la demande) ---------- */
const TR_CACHE={};
async function aiTranslate(txt,lang){
  const key=lang+'|'+txt;if(TR_CACHE[key])return TR_CACHE[key];
  if(!AI)throw new Error('ai');
  const name=(LANGS.find(x=>x[0]===lang)||[,''])[1];
  const res=await AI(`Traduis ce message d’un restaurant, écrit en français, en ${name} (${lang}). Réponds uniquement par la traduction, phrases simples, sans guillemets.\n\n${txt}`,{modelTier:'quick'});
  const out=String(res&&res.text||'').trim();if(out)TR_CACHE[key]=out;return out;
}
function trBtn(txt){return LANG!=='fr'?`<button class="btn xs ghost tr-b" data-act="tr-msg" data-txt="${esc(txt)}">${ic('globe','s')} ${T('Traduire')}</button>`:'';}
Object.assign(ACT,{
  async 'tr-msg'(t){
    const txt=t.dataset.txt||'';const box=t.closest('[data-tr]')||t.parentElement;
    t.disabled=true;t.innerHTML=ic('globe','s')+' …';
    try{const out=await aiTranslate(txt,LANG);let el=box.querySelector('.tr-out');if(!el){el=document.createElement('p');el.className='tr-out';el.setAttribute('data-noi18n','');box.appendChild(el);}el.textContent=out||txt;t.remove();}
    catch(e){t.disabled=false;t.innerHTML=ic('globe','s')+' '+T('Traduire');toast(AI?'Traduction impossible pour l’instant':'La traduction n’est pas disponible ici','alert');}
  },
});
