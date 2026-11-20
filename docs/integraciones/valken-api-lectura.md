# Supply CRM → VÄLKEN: contrato de la API de lectura

**Versión:** 2026-11-20 · **Estado:** implementado y probado en local (rama `feat/valken-lectura-historial`), pendiente de despliegue
**Base:** `https://crm.globalsupplier.com.mx/api/integrations/v1`
**Diseño:** ADR-007 (enmiendas 2026-11-03 y 2026-11-20) · **Evidencia de pruebas:** `valken-evidencia-pruebas.md`

> Todos los datos de ejemplo son **ficticios**. Este documento no contiene keys ni contraseñas.

---

## 0. Qué puede hacer VÄLKEN

| Necesidad | Endpoint |
|---|---|
| Ver el historial de seguimientos de una oportunidad | `GET /analytics/opportunities/{id}`: la oportunidad con **todas** sus actividades |
| Recorrer o sincronizar actividades de todas las unidades | `GET /analytics/activities`: paginado, filtros por oportunidad, empresa, contacto, unidad, tipo, estatus y fechas |
| Listar oportunidades y detectar cuáles necesitan seguimiento | `GET /analytics/opportunities` (ya existía), filtros `estado` y `alerta` |
| Buscar y consultar empresas | `GET /analytics/companies?q=` · `GET /analytics/companies/{id}` |
| Buscar y consultar contactos | `GET /analytics/contacts?q=&company_id=` · `GET /analytics/contacts/{id}` |
| Indicadores comerciales | `GET /analytics/indicators` (ya existía) |
| Escribir cualquier cosa | **No.** Su credencial es de sólo lectura y la base de datos responde 403 |

Todos los endpoints de la API que ya existían, incluidos los que usa n8n hoy, siguen igual.

---

## 1. Autenticación y permisos

### 1.1 Método

- Header en cada llamada: `Authorization: Bearer sint_<64 hex>`
- El CRM sólo guarda el hash SHA-256 de la key. La key en claro se muestra **una sola vez** al emitirla.
- Toda la autorización se valida **en la base de datos**, en cada llamada. No depende de n8n ni de VÄLKEN.
- Las respuestas llevan `Cache-Control: no-store`.

### 1.2 Permisos de la credencial

| Permiso | Quién lo cambia | Efecto |
|---|---|---|
| `can_write = false` | TI (SQL editor) | **Sólo lectura.** Todo `POST`/`PATCH` responde 403 `"Esta integración es de sólo lectura"`. |
| Acceso de análisis | Dirección general / administración en Supply → **Integraciones** | `/analytics/opportunities` y `/analytics/indicators`. Es requisito de los dos siguientes. |
| Historial comercial | Ídem | Los 6 endpoints de historial, incluida la **descripción de actividades** y las notas. |
| Ver email y teléfono de contactos | Ídem | Email, teléfono y celular de contactos y teléfono de empresas. Apagado, llegan `null`. |
| Límites | TI (SQL editor) | Llamadas por minuto y por día. Cada llamada cuenta, incluidas las rechazadas. |

Al apagar "Acceso de análisis" se apagan también el historial y los datos de contacto, y no
reaparecen solos al volver a encenderlo. La pantalla registra quién hizo el último cambio y cuándo.

### 1.3 Alta de la credencial en producción

Se hace una sola vez, **después** de aplicar la migración `20261120120000_integration_historial_valken.sql`:

```sql
-- 1. TI crea el cliente de sólo lectura. El dueño debe ser un usuario ACTIVO del CRM
--    (si se desactiva, la key deja de funcionar). Unidad y dueño no aplican a lectura.
insert into public.integration_clients
  (nombre, etiqueta, business_unit, owner_id, can_write, max_calls_per_minute, max_calls_per_day)
select 'VÄLKEN', 'VALKEN', 'global_supplier_mty', id, false, 30, 1000
from public.profiles
where email = '<correo de dirección general o administración>' and is_active;
```

2. Dirección o administración enciende en Supply → **Integraciones** → VÄLKEN: *Acceso de análisis*
   e *Historial comercial*. *Ver email y teléfono* sólo si se autoriza el contacto directo.
3. TI emite la key y la pega **directamente** en el gestor de credenciales del servidor de VÄLKEN/n8n.
   No se envía por WhatsApp, correo ni chat:

```sql
select public.integration_issue_key(id) from public.integration_clients where nombre = 'VÄLKEN';
```

| Operación | SQL |
|---|---|
| Revocar de inmediato | `select integration_revoke_key(id) from integration_clients where nombre = 'VÄLKEN';` |
| Rotar (invalida la anterior) | `select integration_issue_key(id) from integration_clients where nombre = 'VÄLKEN';` |
| Ajustar límites | `update integration_clients set max_calls_per_day = 2000 where nombre = 'VÄLKEN';` |
| Auditoría | ver §7 |

---

## 2. Endpoints

Todos son `GET`. Cualquier otro método responde 405. Alcance: **todas las unidades**
(`global_supplier_mty`, `cotizia`, `thunder_safety`, `thunder_led`, `got_fresh_breath`, `gtx_systems`,
`juno_promotional`, `fire_spot`).

| Ruta | Permisos | Devuelve |
|---|---|---|
| `/analytics/opportunities/{id}` | análisis + historial | Oportunidad + `company_id`, `contact_id` + `actividades[]` (todas, en orden cronológico) |
| `/analytics/activities` | análisis + historial | Página de actividades con su oportunidad, empresa y contacto |
| `/analytics/companies` | análisis + historial | Página de empresas |
| `/analytics/companies/{id}` | análisis + historial | Empresa + `contactos[]` + `oportunidades[]` |
| `/analytics/contacts` | análisis + historial | Página de contactos |
| `/analytics/contacts/{id}` | análisis + historial | Contacto + `oportunidades[]` |
| `/analytics/opportunities` | análisis | Página de oportunidades (sin actividades). **Sin cambios.** |
| `/analytics/indicators` | análisis | Indicadores de Reportes. **Sin cambios.** |

`/lookup`, `/companies/{id}`, `/contacts/{id}` y `/opportunities*` siguen existiendo con su alcance
original (unidad propia / registros propios); VÄLKEN no los necesita.

---

## 3. Paginación y filtros

### 3.1 Paginación (todos los listados)

| Parámetro | Rango | Default |
|---|---|---|
| `limit` | 1–500 | 100 |
| `offset` | ≥ 0 | 0 |

Cada respuesta paginada trae `total`. Para recorrer: sumar `limit` a `offset` mientras `offset < total`.
**Los parámetros son estrictos:** uno desconocido o mal escrito responde **422**, nunca se ignora.

### 3.2 `GET /analytics/activities`

| Parámetro | Valores | Notas |
|---|---|---|
| `opportunity_id` | UUID | Actividades de una oportunidad |
| `company_id` | UUID | De las oportunidades de esa empresa |
| `contact_id` | UUID | De las oportunidades cuyo contacto es ése |
| `unit` | unidad de negocio | |
| `tipo` | `llamada`, `email`, `reunion`, `demo`, `propuesta`, `seguimiento`, `otro` | |
| `estatus` | `pendiente`, `completada`, `cancelada` | |
| `fecha` | `programada` (default), `completada`, `registro` | Qué fecha filtra el rango: `fecha`, `completed_at` o `created_at` |
| `desde`, `hasta` | `YYYY-MM-DD` | Días de **hora de México**, inclusivos; `desde ≤ hasta` |

Orden: `fecha` descendente (lo más reciente primero).
**Sincronización incremental recomendada:** `fecha=registro&desde=<último día sincronizado>`.

### 3.3 `GET /analytics/companies` y `GET /analytics/contacts`

| Endpoint | Parámetro | Comportamiento |
|---|---|---|
| companies | `q` (2–100 caracteres) | Contenido en el nombre (sin distinguir mayúsculas) **o** inicio del RFC |
| contacts | `q` (2–100 caracteres) | Contenido en "nombre apellido". No busca por email ni teléfono. |
| contacts | `company_id` | Contactos de esa empresa |

Orden: nombre ascendente.

### 3.4 `GET /analytics/opportunities` (sin cambios)

`fecha=creacion|cierre`, `desde`, `hasta`, `unit`, `stage`, `estado=abierta|ganada|perdida|sin_respuesta`,
`alerta=sin_seguimiento|seguimiento_vencido|sin_actividad|cotizacion_pendiente`, `owner`, `limit`, `offset`.
Orden: última modificación primero.

---

## 4. Relaciones entre registros

```
companies ─┬─< contacts            (contacts.company_id, opcional)
           └─< opportunities       (opportunities.company_id, opcional)
contacts ────< opportunities       (opportunities.contact_id: UN contacto principal, opcional)
opportunities ─< activities        (activities.opportunity_id, obligatorio)
```

- **Las actividades siempre cuelgan de una oportunidad.** El historial de una empresa o contacto es el
  de sus oportunidades, y `/analytics/activities?company_id=` o `?contact_id=` lo trae en una llamada.
- Navegación: `/analytics/opportunities/{id}` → `company_id` / `contact_id` → `/analytics/companies/{id}`
  → `oportunidades[].id` → `/analytics/opportunities/{id}`.
- `company_id` y `contact_id` pueden ser `null`, por ejemplo en una oportunidad sin empresa o un contacto sin empresa.
- `/analytics/opportunities` (el listado) trae `id` pero no `company_id`/`contact_id`. Para esos ids se usa
  el detalle.

---

## 5. Respuestas

Éxito: `{ "data": … }`. Error: `{ "error": "…" }` (+ `issues` en 422 de validación).
Fechas-hora ISO 8601 con zona; fechas sin hora `YYYY-MM-DD`. **Todos los campos vienen siempre**;
sin dato = `null` (o lista vacía).

### 5.1 `GET /analytics/opportunities/{id}`

```json
{
  "data": {
    "id": "8f0c2a1e-1111-4a5b-9c3d-000000000001",
    "nombre": "Luminarias LED nave 2",
    "business_unit": "thunder_led",
    "etapa": "cotizacion_enviada",
    "estado": "abierta",
    "seguimiento": "programada",
    "sin_actividad": false,
    "fuente": "web",
    "probabilidad": 50,
    "moneda": "MXN",
    "monto_estimado": 50000,
    "monto_estimado_mxn": 50000,
    "monto_final_mxn": null,
    "fecha_cierre_estimada": null,
    "created_at": "2026-10-05T16:00:00+00:00",
    "last_completed_activity_at": "2026-11-15T17:40:00+00:00",
    "next_activity_at": "2026-11-23T16:00:00+00:00",
    "closed_at": null,
    "notas": "Pidieron cotizar con instalación.",
    "empresa": "Industrias Ejemplo del Norte SA de CV",
    "contacto": { "nombre": "Laura Martínez", "puesto": "Compras", "email": null, "telefono": null, "celular": null },
    "vendedor": { "id": "3b9d7e42-2222-4c1a-8e6f-000000000002", "nombre": "Vendedor Ejemplo" },
    "company_id": "a4e5f6c7-4444-4d3e-b2c1-000000000006",
    "contact_id": "c7a1d9b0-3333-4e2f-a1b2-000000000005",
    "actividades": [
      {
        "id": "e1f2a3b4-6666-4c5d-9e8f-000000000008",
        "tipo": "llamada",
        "estatus": "completada",
        "titulo": "Llamada de descubrimiento",
        "descripcion": "Necesitan 40 luminarias; piden cotización con instalación.",
        "fecha": "2026-11-15T17:00:00+00:00",
        "completed_at": "2026-11-15T17:40:00+00:00",
        "created_at": "2026-11-14T15:02:00+00:00",
        "vendedor": { "id": "3b9d7e42-2222-4c1a-8e6f-000000000002", "nombre": "Vendedor Ejemplo" },
        "creada_por_integracion": false
      },
      {
        "id": "e1f2a3b4-6666-4c5d-9e8f-000000000009",
        "tipo": "seguimiento",
        "estatus": "pendiente",
        "titulo": "Confirmar recepción de cotización",
        "descripcion": null,
        "fecha": "2026-11-23T16:00:00+00:00",
        "completed_at": null,
        "created_at": "2026-11-15T17:41:00+00:00",
        "vendedor": { "id": "3b9d7e42-2222-4c1a-8e6f-000000000002", "nombre": "Vendedor Ejemplo" },
        "creada_por_integracion": false
      }
    ]
  }
}
```

Los campos de la oportunidad son los mismos de `/analytics/opportunities`, con el mismo significado:

| Campo | Significado |
|---|---|
| `estado` | `abierta` / `ganada` / `perdida` / `sin_respuesta` (derivado de la etapa) |
| `seguimiento` | Sólo abiertas: `vencida`, `hoy`, `programada`, `sin_seguimiento`. `null` si está cerrada |
| `sin_actividad` | 7+ días sin actividad (lo calcula la base de datos) |
| `vendedor` (oportunidad) | Quien la cerró; si está abierta, su dueño actual |
| `actividades[].vendedor` | Usuario que **registró** la actividad |
| `actividades[].creada_por_integracion` | `true` si la registró una integración (p. ej. THÖREN), no una persona |

### 5.2 `GET /analytics/activities?opportunity_id=…`

```json
{
  "data": {
    "total": 2,
    "limit": 100,
    "offset": 0,
    "actividades": [
      {
        "id": "e1f2a3b4-6666-4c5d-9e8f-000000000009",
        "tipo": "seguimiento",
        "estatus": "pendiente",
        "titulo": "Confirmar recepción de cotización",
        "descripcion": null,
        "fecha": "2026-11-23T16:00:00+00:00",
        "completed_at": null,
        "created_at": "2026-11-15T17:41:00+00:00",
        "vendedor": { "id": "3b9d7e42-2222-4c1a-8e6f-000000000002", "nombre": "Vendedor Ejemplo" },
        "creada_por_integracion": false,
        "opportunity_id": "8f0c2a1e-1111-4a5b-9c3d-000000000001",
        "oportunidad": "Luminarias LED nave 2",
        "business_unit": "thunder_led",
        "etapa": "cotizacion_enviada",
        "company_id": "a4e5f6c7-4444-4d3e-b2c1-000000000006",
        "contact_id": "c7a1d9b0-3333-4e2f-a1b2-000000000005"
      }
    ]
  }
}
```

(Se muestra una de las dos filas.)

### 5.3 `GET /analytics/companies?q=ejemplo` y `GET /analytics/companies/{id}`

```json
{
  "data": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "empresas": [
      {
        "id": "a4e5f6c7-4444-4d3e-b2c1-000000000006",
        "nombre": "Industrias Ejemplo del Norte SA de CV",
        "rfc": "IEN010101AB1",
        "industria": "Manufactura",
        "sitio_web": "https://ejemplo-norte.mx",
        "telefono": null,
        "ciudad": "Apodaca",
        "estado": "Nuevo León",
        "notas": null,
        "created_at": "2026-08-12T18:30:00+00:00",
        "updated_at": "2026-10-02T17:20:11+00:00"
      }
    ]
  }
}
```

El detalle `/analytics/companies/{id}` trae la misma empresa (sin envoltura de página) más:

```json
"contactos": [
  { "id": "c7a1d9b0-3333-4e2f-a1b2-000000000005", "nombre": "Laura", "apellido": "Martínez", "puesto": "Compras" }
],
"oportunidades": [
  { "id": "8f0c2a1e-1111-4a5b-9c3d-000000000001", "nombre": "Luminarias LED nave 2",
    "business_unit": "thunder_led", "etapa": "cotizacion_enviada", "updated_at": "2026-11-15T17:41:00+00:00" }
]
```

### 5.4 `GET /analytics/contacts?company_id=…` y `GET /analytics/contacts/{id}`

```json
{
  "data": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "contactos": [
      {
        "id": "c7a1d9b0-3333-4e2f-a1b2-000000000005",
        "company_id": "a4e5f6c7-4444-4d3e-b2c1-000000000006",
        "nombre": "Laura",
        "apellido": "Martínez",
        "puesto": "Compras",
        "email": null,
        "telefono": null,
        "celular": null,
        "notas": "Prefiere contacto por la mañana.",
        "created_at": "2026-08-12T18:35:00+00:00",
        "updated_at": "2026-08-12T18:35:00+00:00"
      }
    ]
  }
}
```

El detalle `/analytics/contacts/{id}` trae el contacto más `oportunidades[]` (misma forma que en empresas).
Con *Ver email y teléfono* encendido, `email`, `telefono` y `celular` (y `telefono` de empresas) traen su valor.

### 5.5 Errores

| HTTP | Cuándo | Cuerpo (real) |
|---|---|---|
| 401 | Sin header, formato inválido | `{"error":"API key inválida"}` |
| 401 | Key inexistente o revocada | `{"error":"API key inválida o revocada"}` |
| 403 | Sin *Historial comercial* (o sin *Acceso de análisis*) | `{"error":"La integración no tiene acceso al historial comercial"}` |
| 403 | Intento de escritura con key de sólo lectura | `{"error":"Esta integración es de sólo lectura"}` |
| 403 | El usuario dueño de la integración fue desactivado | `{"error":"El usuario dueño de la integración está desactivado"}` |
| 404 | El id no existe | `{"error":"Oportunidad no encontrada"}` · `"Empresa no encontrada"` · `"Contacto no encontrado"` |
| 405 | Método distinto de GET | cuerpo vacío |
| 422 | Id no UUID, parámetro desconocido, valor inválido, `limit` > 500, rango invertido | ver abajo |
| 429 | Límite por minuto o por día excedido | `{"error":"Límite de llamadas excedido"}` |
| 500 | Error no controlado | `{"error":"Error interno"}` |

```json
{
  "error": "Datos inválidos",
  "issues": [
    { "code": "unrecognized_keys", "keys": ["estado"], "path": [],
      "message": "Unrecognized key(s) in object: 'estado'" }
  ]
}
```

Reintentos: sólo **429** (esperar ≥ 60 s) y **500** (con backoff). No reintentar 401/403/404/422.

---

## 6. Historial comercial: qué guarda realmente el CRM

| Dato | ¿Se almacena? | Campo | ¿VÄLKEN lo lee? |
|---|---|---|---|
| Llamadas, correos, reuniones, demos, propuestas, seguimientos | **Sí, registrados a mano** por el vendedor | `actividades[].tipo`, `titulo`, `descripcion` | Sí |
| Cuándo estaba programada / cuándo se completó / cuándo se registró | Sí | `fecha` / `completed_at` / `created_at` | Sí |
| Quién la registró | Sí | `actividades[].vendedor` | Sí |
| Notas de oportunidad, empresa y contacto | Sí (texto libre) | `notas` | Sí |
| Próximo seguimiento y última actividad completada | Sí (los calcula la base de datos) | `next_activity_at`, `last_completed_activity_at` | Sí |
| Email / teléfono / celular | Sí | contactos, `telefono` de empresas | Sólo con *Ver email y teléfono* |
| **WhatsApp** | **No.** No hay tipo de actividad ni se guardan mensajes; si un vendedor lo registró, aparece como `otro` o `seguimiento` | — | — |
| **Contenido de correos** (cuerpo, asunto real, adjuntos) | **No.** Sólo el registro manual `tipo = email` | — | — |
| Grabaciones / transcripciones de llamadas | **No** | — | — |
| Resultado del seguimiento como campo estructurado | **No.** Sólo lo que el vendedor escribió en `descripcion` y la etapa actual | — | — |
| Historial de cambios de etapa | **No.** Sólo la etapa actual y `closed_at` | — | — |
| Archivos de cotización | Sí, pero **no** se exponen por la API | — | No |

---

## 7. Reglas para que VÄLKEN no invente información

1. **Sin actividades significa sin registro en el CRM**, no "sin contacto". El agente debe decir
   "no hay seguimientos registrados" y no suponer lo que pasó.
2. El contenido de una interacción es **sólo** lo que dice `titulo` y `descripcion`. Si `descripcion`
   es `null`, se sabe que hubo una actividad de ese tipo, pero no qué se habló.
3. `estatus = pendiente` es algo **por hacer**, no algo ocurrido. `cancelada` **no ocurrió**.
4. "Cuándo ocurrió" es `completed_at`. `fecha` es cuándo estaba programada. Algunos registros antiguos
   tienen `estatus = completada` con `completed_at = null`; en ese caso la fecha real es **desconocida**.
5. Un `tipo = email` o `llamada` indica que el vendedor **registró** ese contacto, no que el CRM tenga el
   correo o la llamada.
6. No hay datos de WhatsApp en el CRM.
7. Con `email`/`telefono` en `null` el dato puede existir y estar oculto por permisos. No equivale a "el cliente no tiene email".

---

## 8. Flujo recomendado y consumo de llamadas

Seguimiento de una oportunidad (prioridad): **1 llamada** a `GET /analytics/opportunities/{id}`, que trae
la oportunidad, su contacto y todas sus actividades.

Barrido diario de pendientes:

1. `GET /analytics/opportunities?estado=abierta&alerta=seguimiento_vencido&limit=500`: una llamada por cada 500.
2. Por cada oportunidad a atender: `GET /analytics/opportunities/{id}`.

Sincronización masiva: `GET /analytics/activities?fecha=registro&desde=AAAA-MM-DD&limit=500`, paginando.

Con 30/min y 1,000/día, el barrido de 200 oportunidades consume ~201 llamadas. TI puede ajustar los límites.
Cada llamada queda en la bitácora:

```sql
select l.created_at, l.operacion, l.target_id, l.ok, l.error
from integration_audit_log l join integration_clients c on c.id = l.client_id
where c.nombre = 'VÄLKEN' order by l.id desc limit 100;
```

---

## 9. Configuración en n8n (nodo HTTP Request)

- Method `GET` · URL `https://crm.globalsupplier.com.mx/api/integrations/v1/analytics/opportunities/{{ $json.id }}`
- Authentication: *Generic Credential Type* → *Header Auth* · Name `Authorization` · Value `Bearer sint_…`
  (guardada en el gestor de credenciales del servidor, nunca dentro del flujo)
- Paginación (listados): incrementar `offset` en `limit` mientras `offset < data.total`
- Retry on fail: sólo 429 y 5xx, espera ≥ 60 s

---

## 10. Despliegue y verificación en producción

1. Aplicar la migración con el workflow **Supabase — aplicar migraciones**, primero dry-run (sólo debe
   salir `20261120120000`) y luego `apply`. **La migración va antes que la app**: la app actual sigue
   funcionando con la migración aplicada, pero la nueva necesita las funciones nuevas.
2. Desplegar la app.
3. Dar de alta a VÄLKEN (§1.3).
4. Verificación sin riesgo con la key de VÄLKEN, desde el servidor:

```bash
# Lectura → 200
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/analytics/activities?limit=1" -H "Authorization: Bearer $VALKEN_KEY"

# Escritura → 403 "Esta integración es de sólo lectura".
# La oportunidad no existe: aunque el bloqueo fallara, respondería 404 y no crearía nada.
curl -s -X POST "$BASE/activities" -H "Authorization: Bearer $VALKEN_KEY" -H "Content-Type: application/json" \
  -d '{"opportunity_id":"00000000-0000-4000-8000-000000000000","tipo":"otro","titulo":"verificación","fecha":"2026-01-01T00:00:00-06:00"}'
```

5. Confirmar que THÖREN/n8n sigue operando: en la bitácora deben seguir apareciendo sus llamadas con `ok = true`.

**Reversión:** `docs/integraciones/rollback-20261120-historial.sql` deja la API como estaba. Antes hay que revocar la key de VÄLKEN.
