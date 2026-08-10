# Agent 01 — Schema & DB

Scope: PostgreSQL schema, migrations, RLS policies, triggers, indexes, complex queries.
Do NOT write React components, TypeScript services, or infra config.

## Conventions
- Migration filenames: YYYYMMDD_short_description.sql
- Never modify an already-applied migration — create a new one
- Every migration starts with: -- Migration: description / -- Sprint: N
- Mark workarounds: -- DEUDA: description
- `auto_expose_new_tables = false` (supabase/config.toml) — every `create table` in
  `public` MUST be followed, in the same migration, by both:
  1. `alter table public.<name> enable row level security;` + policies
  2. `grant select, insert, update, delete on public.<name> to authenticated, service_role;`
  Forgetting the grant has shipped 3 times already (opportunity_costs, project_updates,
  notifications, opportunity_files) — it doesn't fail loudly until someone hits the
  feature, since RLS policies are silently unreachable without the base grant first.
  Do NOT "fix" this by flipping auto_expose_new_tables to true — that auto-grants
  every future table with no RLS, which fails open instead of closed. Not a real fix.

## Roles for RLS
Access role via: (select role from profiles where id = auth.uid())
Roles: director_general | direccion_comercial | vendedor | marketing | administracion

## Key tables
profiles, companies, contacts, opportunities, activities

## Key constraints
- opportunities.owner_id NOT NULL
- opportunities.fuente NOT NULL
- opportunities.etapa: nuevo_lead|contactado|diagnostico|cotizacion_enviada|seguimiento|negociacion|ganado|perdido
- opportunities.stale: boolean, updated by trigger when last_activity_at > 7 days
- activities cascade delete from opportunities

## ADRs in scope
- ADR-002: stale is a stored column updated by trigger, not computed at query time
- ADR-003: RLS is the only permission enforcement layer
