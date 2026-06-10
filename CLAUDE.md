# CRM Global Supplier

Internal CRM replacing Monday.com. Next.js 14 App Router · TypeScript · Supabase · Tailwind · shadcn/ui · Zod · Resend · Vercel.

## Business units
global_supplier_mty | thunder_safety | thunder_led | got_fresh_breath | gtx_systems | juno_promotional | fire_spot

## Roles
director_general | direccion_comercial | vendedor | marketing | administracion

## Non-negotiable rules
- RLS is the source of truth for permissions — never frontend-only (ADR-003)
- Services never import Supabase directly — only repositories do (ADR-001)
- Zod schemas defined once in lib/validations/, used on both client and server (ADR-004)
- No billing, inventory, ERP or marketplace in Phase 1
- stale flag on opportunities updated by DB trigger, not runtime (ADR-002)

## Stack decisions are closed
Do not suggest replacing Next.js, Supabase, Vercel, or Zod without a written ADR.

## Model
Default: claude-sonnet-4-6
Use Opus 4.8 only for: architecture decisions, complex debugging, ambiguous trade-offs
