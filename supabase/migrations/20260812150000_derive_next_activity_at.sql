-- Migration: next_activity_at se deriva de la actividad pendiente más próxima
-- Sprint: post-deploy fix
--
-- Antes, next_activity_at solo se seteaba una vez (creación / conversión de lead) y
-- nunca se volvía a tocar aunque se crearan, completaran o borraran actividades — así
-- que oportunidades que sí se estaban trabajando activamente terminaban marcadas
-- "Vencida" para siempre en el Kanban, sin reflejar el trabajo real registrado.
-- Mismo patrón ya usado para last_activity_at/stale (ADR-002): se deriva vía trigger
-- de DB, no en runtime de la app. trg_activity_touch_opp ya dispara esta función en
-- cada insert/update/delete de activities, así que basta con extender su cuerpo.

create or replace function public.recompute_opportunity_stale(opp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest          timestamptz;
  soonest_pending timestamptz;
  current_stage   public.opportunity_stage;
  created         timestamptz;
begin
  select o.etapa, o.created_at into current_stage, created
  from public.opportunities o where o.id = opp_id;

  select max(a.fecha) into latest
  from public.activities a where a.opportunity_id = opp_id;

  -- Próxima actividad pendiente más cercana. null si ya no queda ninguna pendiente —
  -- la UI (ActivityStatusBadge) ya distingue "Sin seguimiento" (gris) de "Vencida"
  -- (rojo), así que un null aquí es una señal correcta, no un bug.
  select min(a.fecha) into soonest_pending
  from public.activities a where a.opportunity_id = opp_id and a.estatus = 'pendiente';

  latest := coalesce(latest, created);

  update public.opportunities
  set last_activity_at = latest,
      next_activity_at = soonest_pending,
      stale = case
        when current_stage in ('ganado', 'perdido') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

-- Backfill: aplica la lógica nueva a todas las oportunidades existentes de una sola
-- vez, para que las que ya están atoradas en "Vencida" se corrijan hoy, no solo la
-- próxima vez que alguien toque una actividad.
do $$
declare
  opp record;
begin
  for opp in select id from public.opportunities loop
    perform public.recompute_opportunity_stale(opp.id);
  end loop;
end $$;
