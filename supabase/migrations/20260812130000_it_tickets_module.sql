-- Migration: panel de tickets de IT (it_tickets, it_ticket_files, it_ticket_messages,
-- it_ticket_stage_logs) + RLS + storage
-- Sprint: post-deploy feature

-- ============================================================
-- Helpers (parte 1). SECURITY DEFINER, mismo patrón que
-- is_full_access()/can_manage_leads() en 20260610170200_rls_policies.sql /
-- 20260615000002_leads_module.sql. Estas dos solo dependen de profiles, que ya
-- existe. can_view_it_ticket() depende de it_tickets, así que se define más
-- abajo, después de crear la tabla — las funciones LANGUAGE SQL (a diferencia
-- de plpgsql) se validan contra el catálogo en el momento del CREATE, no en
-- tiempo de ejecución.
-- ============================================================
create or replace function public.is_it_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role = 'soporte_ti'
  );
$$;

create or replace function public.is_it_oversight()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
      and role in ('soporte_ti', 'director_general', 'administracion')
  );
$$;

grant execute on function public.is_it_staff()    to authenticated;
grant execute on function public.is_it_oversight() to authenticated;

-- ============================================================
-- Tablas
-- ============================================================
create table public.it_tickets (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  description  text,
  brand        public.business_unit not null,
  priority     text        not null default 'medio'
                 check (priority in ('bajo', 'medio', 'alto', 'urgente')),
  status       text        not null default 'abierto'
                 check (status in ('abierto', 'en_proceso', 'qa_ready', 'prod_ready', 'resuelto')),
  requester_id uuid        not null references public.profiles(id),
  assignee_id  uuid        references public.profiles(id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_it_tickets_status      on public.it_tickets (status);
create index idx_it_tickets_priority    on public.it_tickets (priority);
create index idx_it_tickets_requester   on public.it_tickets (requester_id);
create index idx_it_tickets_assignee    on public.it_tickets (assignee_id);
create index idx_it_tickets_resolved_at on public.it_tickets (resolved_at) where resolved_at is not null;

create trigger trg_it_tickets_updated_at
  before update on public.it_tickets
  for each row execute function public.set_updated_at();

-- Helpers (parte 2) — ahora que it_tickets existe.
create or replace function public.can_view_it_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_it_oversight() or exists (
    select 1 from public.it_tickets
    where id = p_ticket_id and (requester_id = auth.uid() or assignee_id = auth.uid())
  );
$$;

grant execute on function public.can_view_it_ticket(uuid) to authenticated;

create table public.it_ticket_files (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.it_tickets(id) on delete cascade,
  file_path  text        not null,
  nombre     text        not null,
  mime_type  text,
  file_size  bigint,
  owner_id   uuid        not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_it_ticket_files_ticket on public.it_ticket_files (ticket_id);

create table public.it_ticket_messages (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.it_tickets(id) on delete cascade,
  content    text        not null,
  file_url   text,
  file_label text,
  author_id  uuid        references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_it_ticket_messages_ticket_created on public.it_ticket_messages (ticket_id, created_at);

create table public.it_ticket_stage_logs (
  id          uuid        primary key default gen_random_uuid(),
  ticket_id   uuid        not null references public.it_tickets(id) on delete cascade,
  from_status text,
  to_status   text        not null,
  changed_by  uuid        references public.profiles(id),
  comment     text,
  changed_at  timestamptz not null default now()
);

create index idx_it_ticket_stage_logs_ticket on public.it_ticket_stage_logs (ticket_id, changed_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.it_tickets enable row level security;

create policy it_tickets_select on public.it_tickets
  for select to authenticated
  using (public.is_it_oversight() or requester_id = auth.uid() or assignee_id = auth.uid());

create policy it_tickets_insert on public.it_tickets
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_active)
  );

-- Solo soporte_ti cambia prioridad/estado. Sin policy de delete: no hay borrado
-- de tickets en v1.
create policy it_tickets_update on public.it_tickets
  for update to authenticated
  using (public.is_it_staff())
  with check (public.is_it_staff());

alter table public.it_ticket_files enable row level security;

create policy it_ticket_files_select on public.it_ticket_files
  for select to authenticated using (public.can_view_it_ticket(ticket_id));

create policy it_ticket_files_insert on public.it_ticket_files
  for insert to authenticated with check (public.can_view_it_ticket(ticket_id));

create policy it_ticket_files_delete on public.it_ticket_files
  for delete to authenticated using (owner_id = auth.uid() or public.is_it_staff());

alter table public.it_ticket_messages enable row level security;

create policy it_ticket_messages_select on public.it_ticket_messages
  for select to authenticated using (public.can_view_it_ticket(ticket_id));

create policy it_ticket_messages_insert on public.it_ticket_messages
  for insert to authenticated with check (public.can_view_it_ticket(ticket_id));

-- Sin policy de delete/update: mensajes inmutables, igual que project_updates.

alter table public.it_ticket_stage_logs enable row level security;

create policy it_ticket_stage_logs_select on public.it_ticket_stage_logs
  for select to authenticated using (public.can_view_it_ticket(ticket_id));

-- Nota: esto deja que un requester inserte una fila de historial en su propio
-- ticket, pero no puede cambiar it_tickets.status directamente (eso exige
-- is_it_staff() vía it_tickets_update). Peor caso: una entrada de historial
-- cosmética falsa — mismo nivel de granularidad ya aceptado en
-- project_decision_logs. No se corrige aquí.
create policy it_ticket_stage_logs_insert on public.it_ticket_stage_logs
  for insert to authenticated with check (public.can_view_it_ticket(ticket_id));

-- ============================================================
-- Grants — auto_expose_new_tables = false, así que toda tabla nueva necesita
-- esto explícito o las policies quedan inalcanzables en silencio (ver
-- supabase/CLAUDE.md, ya se olvidó 3 veces).
-- ============================================================
grant select, insert, update, delete on public.it_tickets           to authenticated, service_role;
grant select, insert, update, delete on public.it_ticket_files      to authenticated, service_role;
grant select, insert, update, delete on public.it_ticket_messages   to authenticated, service_role;
grant select, insert, update, delete on public.it_ticket_stage_logs to authenticated, service_role;

-- ============================================================
-- Storage: prefijo it-tickets/ dentro del bucket media (mismo patrón que
-- opportunity-docs/, ver 20260616140000_storage_opp_docs_policy.sql y
-- 20260807000000_opportunity_files.sql). SELECT ya está cubierto bucket-wide
-- por la policy media_select existente.
-- ============================================================
create policy "media_insert_it_tickets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and name like 'it-tickets/%'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );

create policy "media_delete_it_tickets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and name like 'it-tickets/%'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );
