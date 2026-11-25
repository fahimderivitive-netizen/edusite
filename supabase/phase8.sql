-- Phase 8 migration (idempotent). Run after phase7.sql.
-- On projects where new public tables are not auto-granted, the server-side service_role key
-- needs explicit privileges (it still bypasses RLS). Without this, signed media URLs, the device
-- limit and payments fail with "permission denied".

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Tables and functions created by later migrations get the same privileges
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
