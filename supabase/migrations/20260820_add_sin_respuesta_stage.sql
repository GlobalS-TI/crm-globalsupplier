-- Migration: add sin_respuesta value to opportunity_stage enum
-- Sprint: 6
--
-- Nueva etapa de kanban: "Sin respuesta" — para oportunidades donde el cliente
-- dejó de contestar, sin tener que marcarlas como perdido (lo que penalizaba
-- las métricas del vendedor). Se comporta como etapa cerrada (igual que ganado
-- y perdido): no requiere next_activity_at y se excluye del pipeline abierto.
-- Solo agrega un valor a un enum ya existente — no crea tablas nuevas, así que
-- no aplica la regla de grants de supabase/CLAUDE.md (esa es para "create table").
-- ALTER TYPE ... ADD VALUE no puede usarse en el mismo valor dentro de la misma
-- transacción en la que se agrega, por eso esta migración no hace nada más.

alter type public.opportunity_stage add value if not exists 'sin_respuesta' before 'ganado';
