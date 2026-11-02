-- Migration: restaurar la derivación de next_activity_at en recompute_opportunity_stale
-- Sprint: post-deploy bug fix
--
-- Regresión: 20260928000000_stale_treats_sin_respuesta_as_closed.sql recreó
-- recompute_opportunity_stale() partiendo del cuerpo ORIGINAL de
-- 20260610170100_functions_triggers.sql, no del vigente. Al hacerlo borró la
-- derivación de next_activity_at que habían agregado 20260812150000 y
-- 20260813140000. Desde entonces crear, completar o cancelar una actividad ya no
-- mueve next_activity_at, y el Kanban y Reportes muestran "Vencida" o
-- "Sin seguimiento" con fechas viejas.
--
-- Fix: el cuerpo de 20260813140000 (prefiere la próxima pendiente de hoy en
-- adelante) + sin_respuesta como etapa cerrada (20260928000000).

create or replace function public.recompute_opportunity_stale(opp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest           timestamptz;
  soonest_upcoming timestamptz;
  soonest_overdue  timestamptz;
  current_stage    public.opportunity_stage;
  created          timestamptz;
begin
  select o.etapa, o.created_at into current_stage, created
  from public.opportunities o where o.id = opp_id;

  select max(a.fecha) into latest
  from public.activities a where a.opportunity_id = opp_id;

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
  set last_activity_at = latest,
      next_activity_at = coalesce(soonest_upcoming, soonest_overdue),
      stale = case
        when current_stage in ('ganado', 'perdido', 'sin_respuesta') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

-- Backfill acotado:
-- - Sólo etapas abiertas. Las cerradas no muestran seguimiento y recalcularlas movería
--   su updated_at (trg_opps_updated), que el dashboard usa como fecha de "ganado":
--   todas las ventas aparecerían como ganadas este mes.
-- - Sólo con al menos una actividad. Las que no tienen ninguna conservan el
--   next_activity_at capturado en el alta (formulario o API de integración): el trigger
--   nunca las ha tocado y recalcularlas las dejaría en "Sin seguimiento".
do $$
declare
  opp record;
begin
  for opp in
    select o.id from public.opportunities o
    where o.etapa not in ('ganado', 'perdido', 'sin_respuesta')
      and exists (select 1 from public.activities a where a.opportunity_id = o.id)
  loop
    perform public.recompute_opportunity_stale(opp.id);
  end loop;
end $$;
