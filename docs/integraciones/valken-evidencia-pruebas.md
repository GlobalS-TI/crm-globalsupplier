# Evidencia de pruebas: historial de sólo lectura para VÄLKEN

**Fecha:** 2026-11-20 · **Rama:** `feat/valken-lectura-historial` · **Contrato:** `valken-api-lectura.md`

## Entorno

- **Local**, no producción: Supabase local (Docker, CLI 2.114.0) con todas las migraciones aplicadas,
  incluida `20261120120000_integration_historial_valken.sql`, y Next.js 15.3.9 en `localhost:3100`.
- Las pruebas recorren el camino real: HTTP → route handler → servicio → repositorio → funciones de la DB.
  Algunas además llaman a la DB directamente por PostgREST, para demostrar que el bloqueo no depende de la app.
- Datos y clientes de prueba ficticios con prefijo `[E2E]`. Las keys se emiten en memoria y no se guardan.

| Cliente de prueba | Simula | can_write | Análisis | Historial | Límite/min |
|---|---|---|---|---|---|
| `[E2E] VALKEN` | VÄLKEN | **false** | sí | sí | 60 |
| `[E2E] THOREN-REGRESION` | integración actual (THÖREN) | true | no | no | 60 |
| `[E2E] SIN-HISTORIAL` | cliente con análisis pero sin historial | true | sí | no | 60 |
| `[E2E] LIMITE` | límite de llamadas | false | sí | sí | 3 |

## Cómo reproducirlo

```bash
pnpm db:start                        # Supabase local con seed
supabase migration up --local
pnpm exec next dev -p 3100           # en otra terminal
node scripts/e2e-integracion-historial.mjs resultados.md
```

El script se niega a correr si la API o Supabase no apuntan a `localhost`.

## 1. Pruebas end-to-end

Ejecutado: 2026-11-20T21:33:30.451Z · 45/45 casos OK

#### D. Regresión: integración actual con escritura (réplica de THÖREN)

| Resultado | Caso | Detalle |
|---|---|---|
| ✅ | POST /companies → 201 |  |
| ✅ | POST /contacts → 201 |  |
| ✅ | POST /opportunities → 201 |  |
| ✅ | POST /activities → 201 |  |
| ✅ | PATCH /activities/{id} → 200 |  |
| ✅ | PATCH /opportunities/{id} → 200 |  |
| ✅ | GET /opportunities y /opportunities/{id} → 200 |  |
| ✅ | GET /lookup?rfc= → 200 con la empresa |  |
| ✅ | Sin acceso de análisis: GET /analytics/opportunities → 403 (sin cambio) |  |

#### A. Lectura (VÄLKEN: análisis + historial, sin datos de contacto)

| Resultado | Caso | Detalle |
|---|---|---|
| ✅ | GET /analytics/opportunities/{id} → 200 con actividades, ids y descripción | 2 actividades, unidad thunder_led, email contacto = null |
| ✅ | GET /analytics/activities?opportunity_id= → 200, sólo esa oportunidad | total 2 |
| ✅ | Lee actividades de TODAS las unidades | unidades: cotizia, global_supplier_mty, juno_promotional, thunder_led · 15 actividades |
| ✅ | Paginación: limit/offset recorren todo sin repetir | 15 actividades en páginas de 3 |
| ✅ | Filtros: unidad + tipo + estatus | total 2 (coincide con la DB) |
| ✅ | Filtro por fechas (días de México, inclusivos) coincide con la DB | fecha=registro 2026: 15 |
| ✅ | Filtro por empresa y por contacto | empresa 2, contacto 2 |
| ✅ | GET /analytics/companies?q= → 200 | total 2 |
| ✅ | GET /analytics/companies/{id} → contactos y oportunidades | 1 contactos, 1 oportunidades |
| ✅ | GET /analytics/contacts?company_id= → email/teléfono null sin permiso |  |
| ✅ | GET /analytics/contacts/{id} → oportunidades del contacto |  |
| ✅ | Con "Ver email y teléfono" encendido → email visible | email del contacto y teléfono de la empresa presentes con el switch; se apagó de nuevo |
| ✅ | Endpoints existentes de análisis siguen respondiendo igual |  |

#### B. Autorización

| Resultado | Caso | Detalle |
|---|---|---|
| ✅ | Sin header Authorization → 401 |  |
| ✅ | Key con formato inválido → 401 |  |
| ✅ | Key con formato válido pero inexistente → 401 |  |
| ✅ | Cliente con análisis pero SIN historial → 403 en los 6 endpoints nuevos | 403, 403, 403, 403, 403, 403 · /analytics/opportunities sigue en 200 |
| ✅ | Cliente sin análisis ni historial (réplica THÖREN) → 403 |  |
| ✅ | Apagar análisis a VÄLKEN corta también el historial → 403 |  |
| ✅ | Oportunidad inexistente → 404; id no UUID → 422 |  |
| ✅ | Parámetro desconocido o limit > 500 → 422 |  |
| ✅ | DELETE → 405 |  |
| ✅ | Límite de llamadas (cliente con 3/min) → 429 en la 4ª | 200, 200, 200, 429 |
| ✅ | Key revocada → 401 |  |
| ✅ | Switch de dirección en la DB: rol no autorizado → rechazado; apagar análisis apaga historial y contacto | director: análisis=false fuerza contacto=false e historial=false · vendedor: "No autorizado" |

#### C. Bloqueo de escritura (VÄLKEN, can_write = false)

| Resultado | Caso | Detalle |
|---|---|---|
| ✅ | POST /companies → 403 |  |
| ✅ | POST /contacts → 403 |  |
| ✅ | POST /opportunities → 403 |  |
| ✅ | PATCH /opportunities/{id} → 403 |  |
| ✅ | POST /activities → 403 |  |
| ✅ | PATCH /activities/{id} → 403 |  |
| ✅ | Ningún registro creado ni modificado (conteos y datos intactos) | empresas/contactos/oportunidades/actividades: 10/10/17/15 → 10/10/17/15 |
| ✅ | Bloqueo validado en la DB: RPC directo con service_role → IN403 | PostgREST 400 · IN403: Esta integración es de sólo lectura |
| ✅ | Las funciones *_impl no son invocables desde la API | PostgREST 403 · 42501 |
| ✅ | Los intentos bloqueados quedan en la bitácora (ok = false) | 6 intentos registrados |

#### E. Auditoría de lecturas

| Resultado | Caso | Detalle |
|---|---|---|
| ✅ | Cada lectura de historial queda en integration_audit_log | analytics_indicators:1 · analytics_opportunities:1 · history_activities:12 · history_companies:1 · history_company:2 · history_contact:2 · history_contacts:1 · history_opportunity:2 |

## 2. Pruebas unitarias y tipos

- `pnpm test`: **17 archivos, 318 pruebas, todas pasan.** Incluye `IntegrationHistory.test.ts` (14 nuevas):
  forma de respuesta, conversión de `desde`/`hasta` a hora de México, paginación por defecto y rechazo
  (422) de parámetros desconocidos, tipos inválidos, rangos invertidos, `limit` > 500 e ids no UUID
  **sin consultar la DB**. Las pruebas existentes de análisis y del switch de permisos siguen pasando,
  ajustadas al tercer permiso.
- `pnpm type-check`: sin errores. Los tipos de la DB se regeneraron desde el esquema local y el diff
  sólo trae adiciones.

## 3. Permisos de ejecución en la DB

Consultados con `has_function_privilege` después de aplicar la migración:

| Función | service_role (la API) | authenticated (la app) | anon |
|---|---|---|---|
| `integration_history_*` públicas (6) | ✅ | ❌ | ❌ |
| Envolturas `integration_create_*` / `integration_update_*` (6) | ✅ | ❌ | ❌ |
| `integration_*_impl` (6) | ❌ | ❌ | ❌ |
| `integration_require_write`, helpers `integration_history_*_json/_match/_client` | ❌ | ❌ | ❌ |
| `integration_set_read_permissions` | ❌ | ✅ (revalida rol en la DB) | ❌ |

## 4. Reversión

`docs/integraciones/rollback-20261120-historial.sql` se ejecutó en local: quedaron 0 funciones
`*_impl`/`integration_history_*`, y `integration_create_company` volvió a ser la original con su permiso
para `service_role`. Después la migración se volvió a aplicar limpia y la suite completa pasó otra vez.

## 5. Pantalla /integraciones

Con sesión de dirección general (usuario local del seed), `GET /integraciones` responde 200 y muestra,
para cada integración, los switches *Acceso de análisis*, *Historial comercial* y *Ver email y teléfono*,
y la etiqueta *Sólo lectura* en los clientes con `can_write = false`. El guardado del switch pasa por
`integration_set_read_permissions()`, cuyo comportamiento está probado en el caso B correspondiente.
El clic en el navegador **no** se probó.

## Lo que esta evidencia no cubre

- **Producción.** Nada se ha aplicado ni desplegado. La verificación sin riesgo en producción está en el
  contrato, §10.
- Volumen: los datos locales son pocos (decenas de registros). El diseño es el mismo de análisis, que ya
  está en producción, y no se hicieron pruebas de carga.
- `next lint` no está configurado en el proyecto y no se ejecutó.
