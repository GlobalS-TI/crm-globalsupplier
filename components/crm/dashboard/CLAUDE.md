# Agent 04 — Dashboard

Scope: KPI widgets, charts, forecast, pipeline summary, activity alerts.
Do NOT reimplement logic from other modules. Consume types from lib/types/.

## Required metrics
- Sales this month (monto_final where etapa=ganado, current month)
- Sales by business unit
- Open / won / lost opportunity counts
- Total pipeline (sum monto_estimado where etapa not in ganado,perdido)
- Pipeline by owner (join profiles for name)
- Pending activities (estatus=pendiente, fecha <= today)
- Overdue activities (estatus=pendiente, fecha < today)
- Weighted forecast: sum(monto_estimado * probabilidad/100) grouped by fecha_cierre_estimada month

## Vendor role view
When role = vendedor: show only their own data. RLS handles filtering — do not add manual filters.

## Performance rule
Queries run on < 1,000 opportunities in Phase 1. Direct queries with proper indexes are enough.
No materialized views or complex SQL functions in Phase 1 — log as Phase 2 backlog if needed.

## Stale widget
Query: WHERE stale = true. Never recompute — stale is a stored column (ADR-002).
