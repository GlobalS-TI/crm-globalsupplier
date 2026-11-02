-- Migration: closed_at y last_completed_activity_at en opportunities
-- Sprint: Reportes comerciales — fase B
--
-- 1. closed_at: cuándo la oportunidad pasó a una etapa cerrada (ganado, perdido,
--    sin_respuesta). Hasta ahora el dashboard y comisiones usan updated_at como fecha
--    de "ganado", que se mueve con cualquier edición o actividad posterior. Lo mantiene
--    un trigger (mismo criterio que ADR-002): la app no lo escribe.
--
-- 2. last_completed_activity_at: cuándo se completó la última actividad. last_activity_at
--    es MAX(fecha) de TODAS las actividades, incluidas las pendientes agendadas a futuro,
--    así que "Última actividad" podía mostrar una fecha que todavía no llega. No se
--    cambia last_activity_at porque de él depende el flag stale (y el correo diario de
--    "sin actividad"): con una actividad agendada la oportunidad no se marca stale, y
--    ese comportamiento se conserva.

alter table public.opportunities
  add column closed_at                  timestamptz,
  add column last_completed_activity_at timestamptz;

create index idx_opp_closed_at on public.opportunities (closed_at) where closed_at is not null;

-- ── closed_at ────────────────────────────────────────────────────

create or replace function public.sync_opportunity_closed_at()
returns trigger
language plpgsql
as $$
begin
  if new.etapa not in ('ganado', 'perdido', 'sin_respuesta') then
    new.closed_at := null;
  elsif tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    new.closed_at := now();
  else
    -- Misma etapa cerrada: se conserva la fecha original aunque alguien intente
    -- escribir closed_at directo.
    new.closed_at := old.closed_at;
  end if;
  return new;
end;
$$;

-- ── last_completed_activity_at ───────────────────────────────────
-- Cuerpo de 20261102120000 (derivación de next_activity_at) + last_completed_activity_at.
-- La hora de una actividad completada es completed_at, o su fecha si se registró ya
-- completada; nunca posterior a su updated_at, para que una actividad marcada completada
-- con fecha futura no "adelante" la última actividad.

create or replace function public.recompute_opportunity_stale(opp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest           timestamptz;
  latest_completed timestamptz;
  soonest_upcoming timestamptz;
  soonest_overdue  timestamptz;
  current_stage    public.opportunity_stage;
  created          timestamptz;
begin
  select o.etapa, o.created_at into current_stage, created
  from public.opportunities o where o.id = opp_id;

  select max(a.fecha) into latest
  from public.activities a where a.opportunity_id = opp_id;

  select max(least(coalesce(a.completed_at, a.fecha), a.updated_at)) into latest_completed
  from public.activities a
  where a.opportunity_id = opp_id and a.estatus = 'completada';

  -- Pendiente más próxima de hoy en adelante — si existe, manda sobre cualquier
  -- pendiente vieja sin resolver.
  select min(a.fecha) into soonest_upcoming
  from public.activities a
  where a.opportunity_id = opp_id and a.estatus = 'pendiente'
    and date_trunc('day', a.fecha) >= date_trunc('day', now());

  -- Fallback: pendiente vencida más antigua, solo se usa si no hay ninguna futura.
  select min(a.fecha) into soonest_overdue
  from public.activities a
  where a.opportunity_id = opp_id and a.estatus = 'pendiente'
    and date_trunc('day', a.fecha) < date_trunc('day', now());

  latest := coalesce(latest, created);

  update public.opportunities
  set last_activity_at           = latest,
      last_completed_activity_at = latest_completed,
      next_activity_at           = coalesce(soonest_upcoming, soonest_overdue),
      stale = case
        when current_stage in ('ganado', 'perdido', 'sin_respuesta') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

-- ── Backfill ─────────────────────────────────────────────────────
-- Sin trg_opps_updated: el backfill no debe mover updated_at, que dashboard y comisiones
-- siguen usando como fecha de venta. closed_at histórico = updated_at (la mejor
-- aproximación disponible; no hay historial de etapas).

alter table public.opportunities disable trigger trg_opps_updated;

update public.opportunities
set closed_at = updated_at
where etapa in ('ganado', 'perdido', 'sin_respuesta');

update public.opportunities o
set last_completed_activity_at = c.latest_completed
from (
  select a.opportunity_id, max(least(coalesce(a.completed_at, a.fecha), a.updated_at)) as latest_completed
  from public.activities a
  where a.estatus = 'completada'
  group by a.opportunity_id
) c
where c.opportunity_id = o.id;

alter table public.opportunities enable trigger trg_opps_updated;

-- El trigger de closed_at se crea después del backfill: si existiera antes, la
-- actualización de arriba se vería como "misma etapa" y conservaría el null.
create trigger trg_opp_sync_closed_at
  before insert or update on public.opportunities
  for each row execute function public.sync_opportunity_closed_at();
