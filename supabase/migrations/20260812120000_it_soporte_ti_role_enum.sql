-- Migration: nuevo rol soporte_ti para el panel de tickets de TI
-- Sprint: post-deploy feature
--
-- ALTER TYPE ... ADD VALUE no puede usarse en la misma transacción en la que se
-- agrega, por eso esta migración no hace nada más. Cualquier función/policy que
-- referencie 'soporte_ti' debe ir en una migración posterior (ver
-- 20260812130000_it_tickets_module.sql). Mismo patrón que
-- 20260811000000_add_cotizia_meta_enums.sql.

alter type public.user_role add value if not exists 'soporte_ti';
