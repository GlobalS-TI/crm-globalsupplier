-- Migration: task_column_types_extend
-- Sprint: 8
-- Agrega tipos de columna: archivo, multi_selector, priority

alter type public.task_column_type add value if not exists 'archivo';
alter type public.task_column_type add value if not exists 'multi_selector';
alter type public.task_column_type add value if not exists 'priority';
