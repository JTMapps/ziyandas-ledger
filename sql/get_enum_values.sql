-- SQL helper to return enum labels for a given enum type name
-- Run this in your Supabase SQL editor (public schema).
create or replace function public.get_enum_values(type_name text)
returns table(value text) as $$
  select e.enumlabel as value
  from pg_enum e
  join pg_type t on e.enumtypid = t.oid
  where t.typname = type_name
  order by e.enumsortorder;
$$ language sql stable;

-- Example usage from psql or Supabase RPC:
-- select * from public.get_enum_values('entity_type');