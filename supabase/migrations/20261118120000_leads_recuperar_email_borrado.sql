-- Migration: recuperar el email de leads convertidos que se borró al convertir
-- Sprint: post-deploy bug fix
--
-- LeadRepository.update forzaba `email: null` en todo update parcial, así que al convertir
-- un lead (update de converted_opportunity_id) se perdía su correo. Antes de ese update, la
-- conversión ya había copiado el email al contacto de la oportunidad — se recupera de ahí.
--
-- DEUDA: no recupera (a) leads cuyo email era inválido (la conversión no creó contacto),
-- ni (b) leads sin convertir que perdieron el email al reemplazar su archivo de
-- requerimientos. Esos solo se pueden recuperar del archivo de importación original.
-- Si un vendedor cambió el contacto de la oportunidad después de convertir, el lead toma
-- el email del contacto actual.

update public.leads l
set    email = c.email
from   public.opportunities o
join   public.contacts c on c.id = o.contact_id
where  o.id = l.converted_opportunity_id
  and  l.email is null
  and  c.email is not null;
