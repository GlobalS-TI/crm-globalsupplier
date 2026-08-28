# Supply

CRM interno de Global Supplier — reemplaza Monday.com. Gestión de oportunidades, empresas, contactos, actividades y biblioteca de contenido para las marcas del grupo.

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Backend:** Supabase (Postgres + Auth + Storage), RLS como capa única de permisos
- **Validación:** Zod (schemas compartidos cliente/servidor)
- **UI:** Tailwind CSS + shadcn/ui + Radix
- **Email:** Resend
- **Deploy:** Vercel

Las decisiones de stack están cerradas — ver `docs/adr/` antes de proponer alternativas (Next.js, Supabase, Vercel, Zod).

## Unidades de negocio

`global_supplier_mty` · `cotizia` · `thunder_safety` · `thunder_led` · `got_fresh_breath` · `gtx_systems` · `juno_promotional` · `fire_spot`

## Roles

`director_general` · `direccion_comercial` · `vendedor` · `marketing` · `administracion`

## Requisitos

- Node.js 20+
- pnpm
- Supabase CLI (`npm i -g supabase`) — para desarrollo local con DB

## Setup

```bash
pnpm install
cp .env.example .env
```

Completa `.env` con tus credenciales de Supabase, Resend y un `CRON_SECRET` propio.

Levanta Supabase local y aplica migraciones + seed:

```bash
pnpm db:start
pnpm db:reset
```

Corre la app:

```bash
pnpm dev
```

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |
| `pnpm type-check` | Chequeo de tipos sin emitir |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm db:start` / `db:stop` / `db:status` | Ciclo de vida de Supabase local |
| `pnpm db:reset` | Reaplica migraciones + `seed.sql` desde cero |
| `pnpm db:push` | Aplica migraciones pendientes al proyecto remoto |
| `pnpm db:types` | Regenera `lib/types/database.ts` desde el schema local |

## Variables de entorno

Ver `.env.example`. Resumen:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cliente Supabase (público)
- `SUPABASE_SERVICE_ROLE_KEY` — solo server-side, nunca exponer al cliente
- `RESEND_API_KEY`, `RESEND_FROM` — envío de correo
- `NEXT_PUBLIC_APP_URL` — base URL para links en emails
- `CRON_SECRET` — autentica los cron jobs de Vercel (`vercel.json`)

## Arquitectura

- **Repositorios** son la única capa que importa Supabase directamente; los servicios dependen de interfaces de repositorio, nunca de Supabase (ADR-001).
- **RLS** en Postgres es la fuente de verdad de permisos — cualquier restricción en UI es solo UX, no seguridad (ADR-003).
- **Zod** define cada schema una sola vez en `lib/validations/`, usado tanto en cliente como en servidor (ADR-004).
- El flag `stale` de oportunidades lo actualiza un trigger de DB, no se recalcula en runtime (ADR-002).
- Migraciones en `supabase/migrations/`, nombradas `YYYYMMDD_descripcion.sql`. Nunca se modifica una migración ya aplicada — se crea una nueva.

Fuera de alcance en Fase 1: billing, inventario, ERP, marketplace, AWS (ADR-005).

Decisiones completas y su razonamiento: [`docs/adr/`](docs/adr).

## Estructura del proyecto

```
app/            Next.js App Router — (auth), (dashboard), api/
components/     Componentes React (ver components/CLAUDE.md)
lib/            Services, repositories, validations, types (ver lib/CLAUDE.md)
supabase/       Migraciones, seed, config (ver supabase/CLAUDE.md)
docs/adr/       Architecture Decision Records
docs/sprint-current.md   Checklist del sprint activo
```

Cada carpeta principal tiene su propio `CLAUDE.md` con las reglas de scope para ese módulo.

## Sprint activo

Ver [`docs/sprint-current.md`](docs/sprint-current.md).
