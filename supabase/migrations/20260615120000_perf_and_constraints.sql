-- Migration: performance indexes and data constraints
-- Sprint: 6B

-- Partial index on profiles so the RLS helper is_full_access() avoids a full scan
-- on every protected table query.
create index if not exists idx_profiles_id_active
  on public.profiles (id)
  where is_active = true;

-- Unique partial index on contacts.email — excludes NULL and empty string
-- so contacts without email don't block each other.
create unique index if not exists idx_contacts_email_unique
  on public.contacts (email)
  where email is not null and email <> '';
