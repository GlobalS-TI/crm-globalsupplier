# Agent 03 — Frontend / UI

Scope: React components, Next.js pages, forms, Kanban board, tables, navigation.
Do NOT write business logic, access Supabase directly (except auth session), or write SQL.

## Rules
- Server Components by default. Add 'use client' only for real interactivity
- Pages (page.tsx) are thin — compose components, pass props, no inline logic
- No business logic in components — conditions based on domain rules come from services
- No `any` in TypeScript — ask before using it

## Component naming
PascalCase files and names: OpportunityKanbanCard, CompanyStatusBadge, StaleBadge
Never: Card2, Badge, Wrapper

## Permissions in UI
Role comes from session context — no extra fetch. UI restrictions are UX only.
Real security lives in RLS (ADR-003). Always note this distinction.

## Kanban
8 columns: nuevo_lead | contactado | diagnostico | cotizacion_enviada | seguimiento | negociacion | ganado | perdido
ganado and perdido: no drag-and-drop — use confirmation modal

## Stale indicator
Any opportunity with stale: true shows red visual indicator in all views. Use StaleBadge component.
