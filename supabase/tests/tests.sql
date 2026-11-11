\set QUIET on
\pset tuples_only on
\pset format unaligned
create or replace function t_as(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, true); end $$;
grant execute on function t_as(text) to anon, authenticated;
-- 1. inconnu : pas d'org créée, ne lit rien
begin; select t_as('00000000-0000-0000-0000-0000000000ff'); set local role authenticated;
select 'T01 inconnu my_org null: ' || (my_org() is null);
select 'T02 inconnu lit 0 doc: ' || ((select count(*) from leon_docs) = 0);
select 'T03 inconnu ia refusée: ' || (leon_ia_ticket()->>'raison');
rollback;
select 'T04 orgs toujours 3: ' || (select count(*) from orgs);
-- 2. patron A : son resto seulement
begin; select t_as('00000000-0000-0000-0000-00000000000a'); set local role authenticated;
select 'T05 patronA voit que A: ' || (select count(distinct org_id) from leon_docs) || ' org, ' || (select count(*) from leon_docs) || ' docs';
select 'T06 patronA my_org=A: ' || (my_org()='aaaaaaaa-0000-0000-0000-000000000000');
update leon_docs set data = data || '{"x":1}' where org_id='bbbbbbbb-0000-0000-0000-000000000000';
select 'T07 patronA n''a pas modifié B: ' || (select count(*) from leon_docs where data ? 'x');
select 'T08 patronA ia ok: ' || (leon_ia_ticket()->>'ok');
rollback;
-- 3. salarié A
begin; select t_as('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
select 'T09 salarieA lit: ' || (select string_agg(path, ',' order by path) from leon_docs);
update leon_docs set data = '{"requests":[{"id":"r1"}],"validated":{"2026-11-02":false,"2026-11-09":true},"paieVal":{}}' where path='restos/r1/data/equipe';
update leon_docs set data = '{"liaison":[{"t":"coucou"}],"priceLog":[]}' where path='restos/r1/data/ops';
update leon_docs set data = '{}' where path='restos/r1/pointages/2026-11-10';
reset role;
select 'T10 equipe après salarié: ' || data::text from leon_docs where org_id='aaaaaaaa-0000-0000-0000-000000000000' and path='restos/r1/data/equipe';
select 'T11 ops après salarié: ' || data::text from leon_docs where org_id='aaaaaaaa-0000-0000-0000-000000000000' and path='restos/r1/data/ops';
select 'T12 pointage intact: ' || data::text from leon_docs where org_id='aaaaaaaa-0000-0000-0000-000000000000' and path like '%pointages%';
rollback;
-- 4. tablette A : lit/écrit le pointage de A, pas B
begin; select t_as('00000000-0000-0000-0000-0000000000a2'); set local role authenticated;
select 'T13 tablette voit: ' || (select count(distinct org_id) from leon_docs) || ' org';
update leon_docs set data = '{"e1":[{"t":"in","m":600},{"t":"out","m":900}]}' where path='restos/r1/pointages/2026-11-10';
select 'T14 tablette a badgé: ' || (select count(*) from leon_docs where path like '%pointages%' and data::text like '%out%');
rollback;
-- 5. resto supprimé : patron D, salarié D
begin; select t_as('00000000-0000-0000-0000-00000000000d'); set local role authenticated;
select 'T15 patronD (supprimé) lit: ' || (select count(*) from leon_docs) || ' · ferme=' || (mon_accueil()->>'ferme');
rollback;
begin; select t_as('00000000-0000-0000-0000-0000000000d1'); set local role authenticated;
select 'T16 salarieD (supprimé) lit: ' || (select count(*) from leon_docs);
rollback;
-- 6. créateur : pas d'accès aux docs sans aide ; avec aide oui ; suppression avec code
begin; select t_as('00000000-0000-0000-0000-00000000000c'); set local role authenticated;
select 'T17 createur sans aide lit: ' || (select count(*) from leon_docs);
select 'T18 createur liste restos: ' || (select count(*) from createur_restos());
select 'T19 suppression mauvais code: ' || createur_supprimer_resto('bbbbbbbb-0000-0000-0000-000000000000','0000')::text;
select 'T20 suppression bon code: ' || createur_supprimer_resto('bbbbbbbb-0000-0000-0000-000000000000','4821')::text;
select 'T21 données de B gardées: ' || (select count(*) from createur_restos() where supprime_le is not null);
rollback;
-- 7. visiteur
begin; set local role anon;
insert into demandes (prenom,resto,telephone) values ('Test','Chez Test','0600000000');
select 'T22 visiteur a envoyé une demande: ok';
rollback;
begin; set local role anon; savepoint s;
do $$ begin perform count(*) from leon_docs; raise notice 'T23 ÉCHEC visiteur lit leon_docs'; exception when insufficient_privilege then raise notice 'T23 visiteur ne lit pas leon_docs: ok'; end $$;
do $$ begin perform count(*) from demandes; raise notice 'T24 ÉCHEC visiteur lit demandes'; exception when insufficient_privilege then raise notice 'T24 visiteur ne lit pas demandes: ok'; end $$;
do $$ begin perform my_org(); raise notice 'T25 ÉCHEC'; exception when insufficient_privilege then raise notice 'T25 visiteur n''appelle pas my_org: ok'; end $$;
rollback;
begin; select t_as('00000000-0000-0000-0000-00000000000a'); set local role authenticated;
do $$ begin perform count(*) from leon_codes; raise notice 'T26 ÉCHEC'; exception when insufficient_privilege then raise notice 'T26 compte ne lit pas leon_codes en direct: ok'; end $$;
do $$ begin truncate leon_docs; raise notice 'T27 ÉCHEC'; exception when insufficient_privilege then raise notice 'T27 pas de vidage de table: ok'; end $$;
select 'T28 definir code via fonction: ' || definir_mon_code('4826') || ' / vérif: ' || (verifier_mon_code('4826')->>'ok');
select 'T29 inviter salarié: ' || (length(inviter_salarie('e2','Tom'))=10);
select 'T30 lien tablette: ' || (length(creer_lien_tablette(null))=36);
rollback;
-- 8. frein demandes
begin; insert into demandes (prenom,resto,telephone) select 'x','y','0600000000' from generate_series(1,40);
do $$ begin insert into demandes (prenom,resto,telephone) values ('a','b','0600000000'); raise notice 'T31 ÉCHEC'; exception when others then raise notice 'T31 41e demande refusée: ok'; end $$;
rollback;
-- 9. limite IA
begin; select t_as('00000000-0000-0000-0000-00000000000a'); set local role authenticated;
select 'T32 ia 61e question: ' || (select (array_agg(leon_ia_ticket()->>'ok' order by g))[61] from generate_series(1,61) g);
rollback;
-- 10. responsable A (compte salarié, fiche « accès : manager »)
begin; select t_as('00000000-0000-0000-0000-0000000000a3'); set local role authenticated;
select 'T33 responsable lit: ' || (select string_agg(path, ',' order by path) from leon_docs);
update leon_docs set data = '{"e1":[{"t":"in","m":600},{"t":"out","m":905}]}' where path='restos/r1/pointages/2026-11-10';
update leon_docs set data = data || '{"validated":{"2026-11-09":true}}' where path='restos/r1/data/equipe';
update leon_docs set data = '{"hack":1}' where path in ('restos/r1','net/config');
reset role;
select 'T34 responsable a corrigé le pointage: ' || (data::text like '%905%') from leon_docs where org_id='aaaaaaaa-0000-0000-0000-000000000000' and path like '%pointages%';
select 'T35 responsable a validé des heures: ' || (data->'validated' ? '2026-11-09') from leon_docs where org_id='aaaaaaaa-0000-0000-0000-000000000000' and path='restos/r1/data/equipe';
select 'T36 fiche resto et config intactes: ' || (count(*) = 0) from leon_docs where data ? 'hack';
rollback;
