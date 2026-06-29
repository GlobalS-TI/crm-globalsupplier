-- Tabla de notificaciones: log de envíos + bandeja in-app por usuario
create table public.notifications (
  id            uuid        primary key default gen_random_uuid(),
  recipient_id  uuid        not null references public.profiles(id) on delete cascade,
  type          text        not null,   -- 'stale_digest' | 'lead_assigned' | 'opp_ganada' | 'opp_perdida' | 'lead_converted'
  title         text        not null,
  body          text        not null,
  href          text,                   -- ruta interna para navegar al hacer click
  read_at       timestamptz,            -- null = no leída
  email_sent_at timestamptz,
  email_error   text,
  payload       jsonb       not null default '{}',
  created_at    timestamptz not null default now()
);

-- Índices
create index idx_notif_recipient on public.notifications (recipient_id, created_at desc);
create index idx_notif_unread    on public.notifications (recipient_id) where read_at is null;

-- RLS
alter table public.notifications enable row level security;

-- Cada usuario ve solo sus propias notificaciones
create policy "notif_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

-- Cada usuario puede marcar las suyas como leídas (solo read_at, lo demás lo hace el server)
create policy "notif_update_own" on public.notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- INSERT solo via service role (supabaseAdmin en server actions) — no hay policy pública

-- Habilitar Realtime para push de badge en vivo
alter publication supabase_realtime add table public.notifications;
