# Integración THÖREN AI → Supply CRM (Juno Promotional)

Ver ADR-007 para el diseño. Este documento es la guía operativa y el contrato de la API.

## Alta (una sola vez, SQL editor de Supabase en producción)

1. Aplicar la migración `20261027120000_integracion_thoren.sql` con el workflow
   **Supabase — aplicar migraciones** (Actions → Run workflow sobre `main`): primero en
   dry-run para confirmar que sólo sale esta migración, luego con `apply` marcado.
2. Crear el cliente. El dueño debe ser un usuario activo del CRM:

```sql
insert into public.integration_clients (nombre, etiqueta, business_unit, owner_id)
select 'THÖREN-USER', 'THOREN_AI', 'juno_promotional', id
from public.profiles
where email = 'vpena@globalsupplier.com.mx' and is_active;
```

3. Emitir la key. **Se muestra una sola vez**: copiarla directo al gestor de credenciales de n8n.

```sql
select public.integration_issue_key(id) from public.integration_clients where nombre = 'THÖREN-USER';
```

## Operación

| Acción | SQL |
|---|---|
| Revocar de inmediato | `select integration_revoke_key(id) from integration_clients where nombre = 'THÖREN-USER';` |
| Rotar (invalida la anterior) | `select integration_issue_key(id) from integration_clients where nombre = 'THÖREN-USER';` |
| Ajustar límites | `update integration_clients set max_calls_per_day = 500 where nombre = 'THÖREN-USER';` |
| Auditoría | `select * from integration_audit_log order by id desc limit 100;` |

Límites por defecto: 20 llamadas/minuto, 300/día (contando fallos). Si el dueño se
desactiva en el CRM, la integración deja de funcionar automáticamente.

## Contrato de la API

Base: `https://crm.globalsupplier.com.mx/api/integrations/v1`
Header: `Authorization: Bearer sint_…` · Cuerpo JSON · Respuesta `{ "data": … }` o `{ "error": "…" }`

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/lookup?rfc=` · `?email=` · `?telefono=` | Busca duplicados (coincidencia exacta). Devuelve sólo `id`, `nombre`, `coincidencia`, `autorizado` |
| GET | `/companies/{id}` · `/contacts/{id}` | Detalle, sólo si `autorizado` (lo creó THÖREN o tiene una oportunidad de Juno creada por una persona) |
| POST | `/companies` · `/contacts` | Alta. RFC/email repetido → 409 con el id existente en `detail` |
| GET | `/opportunities?etapa=` | Oportunidades creadas por THÖREN (con sus actividades) |
| GET | `/opportunities/{id}` | Una oportunidad con sus actividades |
| POST | `/opportunities` | Alta. `nombre` y `next_activity_at` requeridos |
| PATCH | `/opportunities/{id}` | Actualización parcial (sólo los campos enviados) |
| POST | `/activities` | Registra actividad (`pendiente` o `completada`) en una opp de THÖREN |
| PATCH | `/activities/{id}` | Actualiza una actividad creada por THÖREN |

Reglas que aplica el CRM (no se pueden saltar desde la API):

- Unidad siempre `juno_promotional`, dueño siempre el configurado, `fuente = 'otro'`,
  notas con prefijo `[THOREN_AI]`. Si se envían otros valores, se ignoran.
- Etapas permitidas: `nuevo_lead` → `negociacion`. `ganado`, `perdido` y `sin_respuesta`
  sólo las asigna una persona; desde ese momento la opp queda en solo lectura para
  THÖREN (`editable: false`).
- Sólo puede modificar lo que él creó. No hay borrado (DELETE → 405).
- La aprobación de cotizaciones antes de enviarlas vive del lado de THÖREN/n8n: el CRM
  sólo registra la etapa `cotizacion_enviada` cuando THÖREN la reporta.

Códigos: 401 key inválida/revocada · 403 fuera de alcance (etapa reservada, opp cerrada)
· 404 no existe o no autorizado · 409 duplicado · 422 datos inválidos · 429 límite excedido.

### Ejemplo

```bash
curl -X POST "$BASE/opportunities" \
  -H "Authorization: Bearer $THOREN_KEY" -H "Content-Type: application/json" \
  -d '{"nombre":"Termos 500 pzas","company_id":"…","contact_id":"…",
       "monto_estimado":45000,"next_activity_at":"2026-11-03T16:00:00-06:00",
       "notas":"Lead por WhatsApp"}'
```
