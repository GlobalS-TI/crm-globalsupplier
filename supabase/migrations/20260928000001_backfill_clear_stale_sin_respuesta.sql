-- Migration: backfill — limpiar vencido en oportunidades ya movidas a sin_respuesta
-- Sprint: post-deploy bug fix
--
-- Complementa 20260928000000_stale_treats_sin_respuesta_as_closed.sql: esa migración
-- arregla el trigger hacia adelante, pero no toca las oportunidades que ya quedaron
-- marcadas vencido=true mientras el barrido nocturno las trataba como etapa abierta.
-- Afectaban el pipeline (badge "Sin actividad" en las 94 tarjetas de "Sin respuesta").
-- One-shot: limpia el estado retroactivamente, en la misma dirección que el trigger.

update public.opportunities
set stale = false
where etapa = 'sin_respuesta'
  and stale = true;
