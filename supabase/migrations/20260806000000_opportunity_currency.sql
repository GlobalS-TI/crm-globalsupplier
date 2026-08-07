-- Migration: soporte de divisa USD en oportunidades y costos, con equivalente MXN calculado por la DB
-- Sprint: 6

create type public.currency as enum ('MXN', 'USD');

-- ============================================================
-- opportunities
-- ============================================================
alter table public.opportunities
  add column moneda                public.currency not null default 'MXN',
  add column tipo_cambio_estimado  numeric(10, 4),
  add column tipo_cambio_final     numeric(10, 4);

-- Equivalente en MXN, calculado una sola vez al escribir la fila (no en runtime,
-- mismo espíritu que ADR-002 para `stale`, pero con columna generada en vez de
-- trigger porque esta expresión es determinista y depende solo de columnas de
-- la misma fila).
alter table public.opportunities
  add column monto_estimado_mxn numeric(14, 2) generated always as (
    case when moneda = 'MXN' then monto_estimado
         else round(monto_estimado * tipo_cambio_estimado, 2)
    end
  ) stored,
  add column monto_final_mxn numeric(14, 2) generated always as (
    case when monto_final is null then null
         when moneda = 'MXN' then monto_final
         else round(monto_final * tipo_cambio_final, 2)
    end
  ) stored;

alter table public.opportunities
  add constraint chk_opp_estimado_currency check (
    (moneda = 'MXN' and tipo_cambio_estimado is null)
    or (moneda = 'USD' and tipo_cambio_estimado > 0)
  ),
  add constraint chk_opp_final_currency check (
    monto_final is null
    or (moneda = 'MXN' and tipo_cambio_final is null)
    or (moneda = 'USD' and tipo_cambio_final > 0)
  );

-- ============================================================
-- opportunity_costs
-- ============================================================
alter table public.opportunity_costs
  add column moneda      public.currency not null default 'MXN',
  add column tipo_cambio numeric(10, 4);

alter table public.opportunity_costs
  add column costo_mxn numeric(12, 2) generated always as (
    case when moneda = 'MXN' then costo
         else round(costo * tipo_cambio, 2)
    end
  ) stored;

alter table public.opportunity_costs
  add constraint chk_cost_currency check (
    (moneda = 'MXN' and tipo_cambio is null)
    or (moneda = 'USD' and tipo_cambio > 0)
  );
