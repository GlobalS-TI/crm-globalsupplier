-- Migration: documentos requeridos para marcar oportunidad como ganada
-- Sprint: 8
-- Cotización y orden de compra se suben desde el modal al pasar a "ganado"

alter table public.opportunities
  add column cotizacion_path    text,
  add column orden_compra_path  text;
