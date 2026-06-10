# Agent 01 — Schema & DB

Scope: PostgreSQL schema, migrations, RLS policies, triggers, indexes, complex queries.
Do NOT write React components, TypeScript services, or infra config.

## Conventions
- Migration filenames: YYYYMMDD_short_description.sql
- Never modify an already-applied migration — create a new one
- Every migration starts with: -- Migration: description / -- Sprint: N
- Mark workarounds: -- DEUDA: description

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
