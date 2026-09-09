-- Migration: task_notas_chat
-- Sprint: post-deploy feature
--
-- La columna "Notas" del tablero de Actividades es hoy tipo 'text' — un solo
-- bloque de texto editado en línea, incómodo de leer cuando la nota es larga
-- (obliga a hacer scroll horizontal). Se agrega el tipo 'notas', respaldado
-- por un hilo de mensajes tipo chat (mismo patrón que it_ticket_messages),
-- para que cada nota sea un mensaje con autor y fecha en vez de un string
-- plano.
--
-- task_column_values.value se conserva como preview denormalizado (último
-- mensaje enviado) — evita tener que cargar el hilo completo solo para
-- pintar la tabla.
--
-- El valor de enum 'notas' se agregó en 20260909120000_task_notas_chat_enum.sql
-- (en su propia migración/transacción — no se puede usar un valor de enum
-- nuevo en la misma transacción en la que se agrega).

-- ============================================================
-- 1. Hilo de mensajes por (task, columna)
-- ============================================================
create table public.task_note_messages (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null references public.tasks(id) on delete cascade,
  column_id  uuid        not null references public.task_board_columns(id) on delete cascade,
  content    text        not null,
  author_id  uuid        references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_task_note_messages_task_column on public.task_note_messages (task_id, column_id, created_at);

alter table public.task_note_messages enable row level security;

-- Mismo criterio de visibilidad que task_column_values (ver
-- 20260715180000_scope_tasks_visibility.sql y
-- 20260806000001_director_general_tasks_read_access.sql): creador,
-- responsable, o director_general en solo lectura.
create policy "task_note_messages_select" on public.task_note_messages
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_note_messages.task_id
        and (
          t.created_by = auth.uid()
          or t.assigned_to = auth.uid()
          or public.is_director_general()
        )
    )
  );

-- Solo creador/responsable pueden escribir — director_general permanece de
-- solo lectura, igual que el resto del tablero ajeno.
create policy "task_note_messages_insert" on public.task_note_messages
  for insert with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_note_messages.task_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

-- Sin policy de update/delete: mensajes inmutables, igual que it_ticket_messages.

grant select, insert, update, delete on public.task_note_messages to authenticated, service_role;

-- ============================================================
-- 2. Backfill: columnas "Notas" existentes (tipo 'text') pasan a 'notas',
--    y su valor actual se migra como primer mensaje del hilo.
-- ============================================================
insert into public.task_note_messages (task_id, column_id, content, author_id, created_at)
select tcv.task_id, tcv.column_id, tcv.value, t.created_by, t.created_at
from public.task_column_values tcv
join public.task_board_columns c on c.id = tcv.column_id
join public.tasks t on t.id = tcv.task_id
where c.tipo = 'text'
  and lower(c.nombre) = 'notas'
  and tcv.value is not null
  and length(trim(tcv.value)) > 0;

update public.task_board_columns
set tipo = 'notas'
where tipo = 'text'
  and lower(nombre) = 'notas';
