-- Migration: next_activity_at prefiere la próxima actividad pendiente NO vencida
-- Sprint: post-deploy fix
--
-- recompute_opportunity_stale() (20260812150000) usaba MIN(fecha) de TODAS las
-- actividades pendientes. Si un vendedor agenda un seguimiento a futuro pero deja
-- una actividad vieja sin marcar como completada/cancelada, el MIN() seguía
-- agarrando la fecha vieja — la oportunidad se quedaba "Vencida" para siempre
-- aunque ya hubiera trabajo agendado, porque la actividad nueva quedaba "enterrada"
-- detrás de la pendiente sin resolver.
--
-- Ahora: si existe al menos una actividad pendiente de hoy en adelante, se usa la
-- más próxima de esas (la oportunidad deja de verse "Vencida"). Solo se cae de
-- vuelta a la más antigua vencida cuando NINGUNA pendiente tiene fecha de hoy o
-- futura — que es exactamente cuando sí debe seguir marcándose como vencida.

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
        when current_stage in ('ganado', 'perdido') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

-- Backfill: recalcula todas las oportunidades existentes con el criterio nuevo.
do $$
declare
  opp record;
begin
  for opp in select id from public.opportunities loop
    perform public.recompute_opportunity_stale(opp.id);
  end loop;
end $$;
