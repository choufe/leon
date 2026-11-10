-- comptes : créateur, patron A, patron B, salarié A, tablette A, inconnu, patron supprimé
insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-00000000000c','createur@x'),('00000000-0000-0000-0000-00000000000a','patronA@x'),('00000000-0000-0000-0000-00000000000b','patronB@x'),
 ('00000000-0000-0000-0000-0000000000a1','salarieA@x'),('00000000-0000-0000-0000-0000000000a2','tabletteA@x'),('00000000-0000-0000-0000-0000000000ff','inconnu@x'),
 ('00000000-0000-0000-0000-00000000000d','patronD@x'),('00000000-0000-0000-0000-0000000000d1','salarieD@x');
insert into leon_createurs (user_id,pin_hash,pin_ok_jusqu) values ('00000000-0000-0000-0000-00000000000c', extensions.crypt('4821', extensions.gen_salt('bf')), now()+interval '1 hour');
insert into orgs (id,name,owner_user_id) values ('aaaaaaaa-0000-0000-0000-000000000000','Resto A','00000000-0000-0000-0000-00000000000a'),('bbbbbbbb-0000-0000-0000-000000000000','Resto B','00000000-0000-0000-0000-00000000000b');
insert into orgs (id,name,owner_user_id,supprime_le) values ('dddddddd-0000-0000-0000-000000000000','Resto D supprimé','00000000-0000-0000-0000-00000000000d', now());
insert into leon_salaries (user_id,org_id,emp_id) values ('00000000-0000-0000-0000-0000000000a1','aaaaaaaa-0000-0000-0000-000000000000','e1'),('00000000-0000-0000-0000-0000000000d1','dddddddd-0000-0000-0000-000000000000','e9');
insert into leon_tablettes (user_id,org_id) values ('00000000-0000-0000-0000-0000000000a2','aaaaaaaa-0000-0000-0000-000000000000');
insert into leon_docs (org_id,path,data) select o, p, d from (values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid),('bbbbbbbb-0000-0000-0000-000000000000'),('dddddddd-0000-0000-0000-000000000000')) orgs(o),
 (values ('net/config','{"adminCode":"1111","adminPass":"secret","restos":["r1"]}'::jsonb),('restos/r1','{"nom":"R","codes":{"patron":"2222"},"emp":[{"id":"e1","prenom":"Léa","code":"3333","taux":12.5}]}'),
  ('restos/r1/data/equipe','{"requests":[],"validated":{"2026-11-02":true},"paieVal":{"2026-10":true},"checks":{}}'),('restos/r1/data/ops','{"liaison":[],"priceLog":[{"p":1}]}'),
  ('restos/r1/data/planning','{"shifts":[]}'),('restos/r1/data/stock','{"st":{}}'),('restos/r1/pointages/2026-11-10','{"e1":[{"t":"in","m":600}]}')) docs(p,d);
