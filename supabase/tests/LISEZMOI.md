# Tester les règles de la base sur une copie locale

Ces fichiers rejouent toutes les migrations sur un Postgres local et vérifient, compte par compte
(créateur, patron, salarié, tablette, inconnu, visiteur), qui peut lire et écrire quoi.

```
psql -f supabase/tests/shim.sql            # imite Supabase (rôles, auth.uid())
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -f $f; done
psql -f supabase/tests/seed.sql            # 3 restos, 8 comptes
psql -f supabase/tests/tests.sql           # 36 vérifications : chaque ligne doit finir par true / ok
```
À relancer après chaque nouvelle migration qui touche aux règles d'accès.
