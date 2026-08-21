-- Migration: agrega el estado "cancelado" a it_tickets
-- Sprint: post-deploy feature
-- Idempotente (drop + add constraint) porque este cambio se preparó en dos
-- ramas en paralelo (dropdown de estados y vista kanban) — cualquiera de las
-- dos que se mergee primero deja esto aplicado, y la segunda lo reaplica sin
-- error.

alter table public.it_tickets drop constraint if exists it_tickets_status_check;

alter table public.it_tickets add constraint it_tickets_status_check
  check (status in ('abierto', 'en_proceso', 'qa_ready', 'prod_ready', 'resuelto', 'cancelado'));
