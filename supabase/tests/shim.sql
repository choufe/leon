create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema extensions;
create extension if not exists pgcrypto with schema extensions;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public, extensions to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
-- comme Supabase : tout est accordé par défaut aux rôles de l'API
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
create publication supabase_realtime;
alter database postgres set search_path = public, extensions;
