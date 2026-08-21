-- Migration: policy de DELETE para it_tickets
-- Sprint: post-deploy feature
-- Razón: 20260812130000_it_tickets_module.sql dejó it_tickets sin policy de
--        delete a propósito ("no hay borrado de tickets en v1"). Ahora se
--        habilita, restringido al mismo grupo que ya gestiona prioridad/estado
--        (is_it_staff() — soporte_ti o profiles.it_staff).

create policy it_tickets_delete on public.it_tickets
  for delete to authenticated
  using (public.is_it_staff());
