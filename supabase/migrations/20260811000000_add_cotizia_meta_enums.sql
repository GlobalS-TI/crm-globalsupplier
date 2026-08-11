-- Migration: nueva marca (Cotizia) y nueva fuente de lead (Meta/Facebook)
-- Sprint: post-deploy feature
--
-- Solo agrega valores a enums ya existentes — no crea tablas nuevas, así que no
-- aplica la regla de grants de supabase/CLAUDE.md (esa es para "create table").
-- ALTER TYPE ... ADD VALUE no puede usarse en el mismo valor dentro de la misma
-- transacción en la que se agrega, por eso esta migración no hace nada más.

alter type public.business_unit add value if not exists 'cotizia';
alter type public.lead_source add value if not exists 'meta';
