-- Migration: stale flag debe tratar sin_respuesta como etapa cerrada
-- Sprint: post-deploy bug fix
--
-- Bug: la migración 20260820_add_sin_respuesta_stage.sql agregó "sin_respuesta"
-- como etapa que "se comporta como etapa cerrada (igual que ganado y perdido)"
-- y el kanban ya la trata así (ver CLOSED set en OpportunityKanbanBoard.tsx),
-- pero la lógica de stale/vencido (ADR-002) nunca se actualizó: las 3 funciones
-- de supabase/migrations/20260610170100_functions_triggers.sql siguen filtrando
-- solo por ('ganado', 'perdido'). Resultado: cualquier oportunidad movida a
-- "Sin respuesta" nunca limpia el flag vencido, y el barrido nocturno
-- (mark_stale_opportunities) la vuelve a marcar vencido para siempre, porque
-- para la DB esa etapa sigue "abierta". Eso obligaba a soporte a limpiarlo
-- a mano por ticket (ver ticket "QUITAR VENCIDO").
--
-- Fix: agregar 'sin_respuesta' junto a ganado/perdido en las 3 funciones.
-- Se recrean con CREATE OR REPLACE (no se modifica la migración original,
-- por regla de supabase/CLAUDE.md).

create or replace function public.recompute_opportunity_stale(opp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest timestamptz;
  current_stage public.opportunity_stage;
  created timestamptz;
begin
  select o.etapa, o.created_at into current_stage, created
  from public.opportunities o where o.id = opp_id;

  select max(a.fecha) into latest
  from public.activities a where a.opportunity_id = opp_id;

  latest := coalesce(latest, created);

  update public.opportunities
  set last_activity_at = latest,
      stale = case
        when current_stage in ('ganado', 'perdido', 'sin_respuesta') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

-- A closed opportunity is never stale — enforce it the moment it closes.
create or replace function public.sync_stale_on_close()
returns trigger
language plpgsql
as $$
begin
  if new.etapa in ('ganado', 'perdido', 'sin_respuesta') then
    new.stale := false;
  end if;
  return new;
end;
$$;

-- Daily sweep: flip open opportunities that have gone quiet for > 7 days.
create or replace function public.mark_stale_opportunities()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.opportunities
  set stale = true
  where etapa not in ('ganado', 'perdido', 'sin_respuesta')
    and stale = false
    and coalesce(last_activity_at, created_at) < (now() - interval '7 days');
  get diagnostics affected = row_count;
  return affected;
end;
$$;
