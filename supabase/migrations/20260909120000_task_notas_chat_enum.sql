-- Migration: task_notas_chat_enum
-- Sprint: post-deploy feature
--
-- Separado en su propia migración: un nuevo valor de enum no puede usarse
-- en la misma transacción en la que se agrega (Postgres lo rechaza con
-- "unsafe use of new value of enum type"). El resto del cambio (tabla de
-- mensajes, RLS, backfill que sí usa 'notas') va en la migración siguiente.

alter type public.task_column_type add value if not exists 'notas';
