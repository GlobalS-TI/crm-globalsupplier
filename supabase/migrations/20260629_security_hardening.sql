-- Migration: security_hardening
-- Sprint: 6

-- ============================================================
-- C2: Revocar grants excesivos al rol `anon`.
-- La migración 20260622213753_init_schema.sql (generada por Supabase CLI)
-- otorgó SELECT/INSERT/UPDATE/DELETE a anon en todas las tablas.
-- Este CRM es interno — el rol anon nunca debe tocar datos de negocio.
-- RLS bloquea el acceso en la práctica, pero revocamos de forma explícita
-- para defensa en profundidad: si alguna tabla pierde RLS por error, los
-- datos no quedan expuestos a cualquier poseedor de la anon key pública.
-- ============================================================

revoke all on public.activities             from anon;
revoke all on public.companies              from anon;
revoke all on public.contacts               from anon;
revoke all on public.content_categories     from anon;
revoke all on public.content_files          from anon;
revoke all on public.content_items          from anon;
revoke all on public.lead_sections          from anon;
revoke all on public.leads                  from anon;
revoke all on public.opportunities          from anon;
revoke all on public.opportunity_costs      from anon;
revoke all on public.profile_business_units from anon;
revoke all on public.profiles               from anon;
revoke all on public.project_briefs         from anon;
revoke all on public.project_decision_logs  from anon;
revoke all on public.project_files          from anon;
revoke all on public.project_handoff_checklists from anon;
revoke all on public.project_stage_logs     from anon;
revoke all on public.project_updates        from anon;
revoke all on public.projects               from anon;
revoke all on public.sales_targets          from anon;
revoke all on public.task_board_columns     from anon;
revoke all on public.task_boards            from anon;
revoke all on public.task_column_values     from anon;
revoke all on public.task_groups            from anon;
revoke all on public.tasks                  from anon;

-- ============================================================
-- C1: Eliminar escalada de privilegios via metadata en signup.
-- handle_new_user() leía `role` de raw_user_meta_data, permitiendo
-- que cualquier llamada a supabase.auth.signUp({ data: { role: 'director_general' } })
-- creara un perfil con acceso total. Los roles sólo los asigna
-- un director_general activo después del registro.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    'vendedor'   -- rol siempre mínimo; director_general lo sube después
  );
  return new;
end;
$$;

-- ============================================================
-- M1: enforce_role_immutable — agregar verificación is_active.
-- Un director_general desactivado podía seguir cambiando roles
-- porque la consulta no filtraba is_active = true.
-- ============================================================
create or replace function public.enforce_role_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'director_general'
        and is_active = true          -- añadido: director desactivado no puede cambiar roles
    ) then
      raise exception 'Only an active director_general can change a profile role';
    end if;
  end if;
  return new;
end;
$$;

-- ============================================================
-- H1: is_project_team() — agregar set search_path = public.
-- Sin este atributo, un atacante con control del search_path puede
-- hacer que la función SECURITY DEFINER lea tablas falsas.
-- ============================================================
create or replace function public.is_project_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id     = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'administracion')
  )
$$;

-- ============================================================
-- H2: is_comisiones_viewer() — agregar set search_path = public.
-- Mismo riesgo que is_project_team().
-- También agrega verificación is_active que faltaba.
-- ============================================================
create or replace function public.is_comisiones_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id       = auth.uid()
      and is_active = true
      and role in ('director_general', 'administracion')
  )
$$;
