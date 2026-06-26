-- Migration: projects_add_tipo_industrial_stages
-- Sprint: 6

-- Stages industriales
alter type public.project_status add value if not exists 'ORDEN_COMPRA';
alter type public.project_status add value if not exists 'FACTURACION';
alter type public.project_status add value if not exists 'SEGUIMIENTO';
alter type public.project_status add value if not exists 'CIERRE';

-- Tipo de proyecto (idempotent — may already exist if first db:push attempt ran SQL but failed tracking)
do $$ begin
  create type public.project_tipo as enum ('DISENO', 'INDUSTRIAL');
exception when duplicate_object then null;
end $$;

-- Columna tipo (default DISENO para proyectos existentes)
alter table public.projects
  add column if not exists tipo public.project_tipo not null default 'DISENO';
