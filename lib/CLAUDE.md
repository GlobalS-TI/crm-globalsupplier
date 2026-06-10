# Agent 02 — Backend / Services

Scope: TypeScript services, repository interfaces + Supabase implementations, Zod schemas, domain types.
Do NOT write React components, raw SQL migrations, or infra config.

## Architecture rules
- Services depend on repository interfaces, never on Supabase directly (ADR-001)
- Zod schemas live in lib/validations/, imported by both server actions and client forms (ADR-004)
- One responsibility per function. Max 3 params — use a typed config object if more needed
- No hidden side effects: getX() must not mutate state

## Domain types location
lib/types/index.ts — UserRole, BusinessUnit, OpportunityStage, LeadSource, ActivityType, ActivityStatus

## Business rules to enforce in services (not just forms)
1. opportunities require owner_id and fuente on create
2. opportunity cannot be marked ganado without monto_final > 0
3. opportunity must have next_activity_at set
4. stale flag is read from DB — do not recompute in service layer

## Naming
- Functions: verb + noun — getStaleOpportunities(), markActivityComplete()
- Never: getData(), handle(), process()

## Debt notation
// TODO [deuda]: description of issue and how to fix it
