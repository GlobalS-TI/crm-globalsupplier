-- Migration: projects_add_tipo_industrial_stages
-- Sprint: 6

-- Stages industriales
alter type public.project_status add value if not exists 'ORDEN_COMPRA';
alter type public.project_status add value if not exists 'FACTURACION';
alter type public.project_status add value if not exists 'SEGUIMIENTO';
alter type public.project_status add value if not exists 'CIERRE';

-- Tipo de proyecto
create type public.project_tipo as enum ('DISENO', 'INDUSTRIAL');

-- Columna tipo (default DISENO para proyectos existentes)
alter table public.projects
  add column tipo public.project_tipo not null default 'DISENO';
