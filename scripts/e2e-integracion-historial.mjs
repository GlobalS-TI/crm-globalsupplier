// Pruebas end-to-end de la API de integración: historial de sólo lectura (VÄLKEN), permisos,
// bloqueo de escritura y regresión de la integración con escritura (THÖREN). ADR-007.
//
// SÓLO LOCAL: crea clientes y datos [E2E] y escribe en la DB. Se niega a correr si la API o
// Supabase no son localhost. Las keys se emiten en memoria y nunca se escriben a disco.
//
// Uso (Supabase local arriba con `pnpm db:start` + seed, y `pnpm exec next dev -p 3100`):
//   node scripts/e2e-integracion-historial.mjs [resultados.md] [ejemplos.json]
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync, execSync } from 'node:child_process'

const [outMd, outJson] = process.argv.slice(2)
const BASE = process.env.E2E_BASE ?? 'http://localhost:3100/api/integrations/v1'
const supabaseEnv = Object.fromEntries(
  execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }),
)
const { API_URL, SERVICE_ROLE_KEY } = supabaseEnv
const isLocal = url => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url + '/')
if (!isLocal(BASE) || !isLocal(API_URL)) {
  console.error(`Abortado: sólo corre contra localhost (API ${BASE}, Supabase ${API_URL})`)
  process.exit(2)
}

// Datos ficticios propios, ids fijos. Dueños del seed: 00000001 (director_general), 00000003 (vendedor).
const DIRECTOR = '00000001-0000-0000-0000-000000000000'
const VENDEDOR = '00000003-0000-0000-0000-000000000000'
const A1      = 'e2e00000-0000-4000-8000-0000000000a1'   // thunder_led, 2 actividades registradas por una persona
const ACME    = 'e2e00000-0000-4000-8000-0000000000c1'
const ANA     = 'e2e00000-0000-4000-8000-0000000000d1'
const MISSING = '00000000-0000-4000-8000-00000000dead'

const results = []
const samples = {}
let group = ''

function expect(cond, msg) { if (!cond) throw new Error(msg) }

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ group, name, ok: true, detail: detail ?? '' })
  } catch (e) {
    results.push({ group, name, ok: false, detail: e.message })
  }
}

async function api(method, path, key, body) {
  const headers = {}
  if (key !== undefined) headers.Authorization = `Bearer ${key}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: res.status, json }
}

async function rpc(fn, args) {
  const res = await fetch(`${API_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  return { status: res.status, json: await res.json().catch(() => null) }
}

function sql(query) {
  return execFileSync('docker', ['exec', '-i', 'supabase_db_crm-globalsupplier', 'psql', '-U', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'],
    { input: query, encoding: 'utf8' }).trim()
}

const hash = key => createHash('sha256').update(key).digest('hex')
const counts = () => sql(`select (select count(*) from companies)||'/'||(select count(*) from contacts)||'/'||(select count(*) from opportunities)||'/'||(select count(*) from activities);`)

// ── Preparación: datos ficticios + 4 clientes de prueba en estado conocido ──
sql(`
  insert into companies (id, nombre, telefono, owner_id) values ('${ACME}', '[E2E] Acme SA', '8180000000', '${VENDEDOR}') on conflict (id) do nothing;
  insert into contacts (id, company_id, nombre, apellido, puesto, email, celular, owner_id)
    values ('${ANA}', '${ACME}', 'Ana', 'López', 'Compras', 'ana.lopez@ejemplo.test', '8110000000', '${VENDEDOR}')
    on conflict (id) do nothing;
  insert into opportunities (id, nombre, company_id, contact_id, owner_id, business_unit, etapa, fuente, monto_estimado, next_activity_at)
    values ('${A1}', '[E2E] Luminarias nave 2', '${ACME}', '${ANA}', '${VENDEDOR}', 'thunder_led', 'cotizacion_enviada', 'web', 50000, now() + interval '3 days')
    on conflict (id) do nothing;
  insert into activities (id, opportunity_id, owner_id, tipo, estatus, titulo, descripcion, fecha, completed_at) values
    ('e2e00000-0000-4000-8000-0000000000b1', '${A1}', '${VENDEDOR}', 'llamada', 'completada', '[E2E] Llamada de descubrimiento',
     'Necesitan 40 luminarias; piden cotización con instalación.', now() - interval '5 days', now() - interval '5 days'),
    ('e2e00000-0000-4000-8000-0000000000b2', '${A1}', '${VENDEDOR}', 'seguimiento', 'pendiente', '[E2E] Confirmar recepción de cotización',
     null, now() + interval '3 days', null)
    on conflict (id) do nothing;

  insert into integration_clients
    (nombre, etiqueta, business_unit, owner_id, can_write, can_read_analytics, can_read_history, max_calls_per_minute, max_calls_per_day)
  values
    ('[E2E] VALKEN',           'VALKEN',    'global_supplier_mty', '${DIRECTOR}', false, true,  true,  60, 2000),
    ('[E2E] THOREN-REGRESION', 'THOREN_AI', 'juno_promotional',    '${DIRECTOR}', true,  false, false, 60, 2000),
    ('[E2E] SIN-HISTORIAL',    'SINHIST',   'global_supplier_mty', '${DIRECTOR}', true,  true,  false, 60, 2000),
    ('[E2E] LIMITE',           'LIMITE',    'global_supplier_mty', '${DIRECTOR}', false, true,  true,  3,  2000)
  on conflict (nombre) do nothing;
  update integration_clients set
    can_read_contact_pii = false,
    can_read_analytics   = nombre <> '[E2E] THOREN-REGRESION',
    can_read_history     = nombre in ('[E2E] VALKEN', '[E2E] LIMITE'),
    can_write            = nombre in ('[E2E] THOREN-REGRESION', '[E2E] SIN-HISTORIAL')
  where nombre like '[E2E] %';
  delete from integration_audit_log where client_id in (select id from integration_clients where nombre like '[E2E] %');
`)
const KEYS = Object.fromEntries(
  sql(`select replace(nombre, '[E2E] ', '') || '=' || integration_issue_key(id) from integration_clients where nombre like '[E2E] %';`)
    .split('\n').map(l => l.split('=')),
)
const V = KEYS.VALKEN, T = KEYS['THOREN-REGRESION']
KEYS.SINHIST_KEY = KEYS['SIN-HISTORIAL']
KEYS.LIMITE_KEY  = KEYS.LIMITE

// ─────────────────────────────────────────────────────────────────────
group = 'D. Regresión: integración actual con escritura (réplica de THÖREN)'
let thoren = {}
const rfc = ('E2E' + Date.now()).slice(0, 12).toUpperCase().padEnd(12, 'X')

await check('POST /companies → 201', async () => {
  const r = await api('POST', '/companies', T, { nombre: '[E2E] Empresa regresión', rfc })
  expect(r.status === 201, `status ${r.status} ${JSON.stringify(r.json)}`)
  thoren.company = r.json.data.id
})
await check('POST /contacts → 201', async () => {
  const r = await api('POST', '/contacts', T, { nombre: '[E2E] Contacto', company_id: thoren.company, email: `e2e-${Date.now()}@ejemplo.test` })
  expect(r.status === 201, `status ${r.status} ${JSON.stringify(r.json)}`)
  thoren.contact = r.json.data.id
})
await check('POST /opportunities → 201', async () => {
  const r = await api('POST', '/opportunities', T, {
    nombre: '[E2E] Opp regresión', company_id: thoren.company, contact_id: thoren.contact,
    monto_estimado: 1000, next_activity_at: '2026-12-01T16:00:00-06:00',
  })
  expect(r.status === 201, `status ${r.status} ${JSON.stringify(r.json)}`)
  thoren.opp = r.json.data.id
})
await check('POST /activities → 201', async () => {
  const r = await api('POST', '/activities', T, { opportunity_id: thoren.opp, tipo: 'llamada', titulo: '[E2E] Llamada', fecha: '2026-11-25T16:00:00-06:00' })
  expect(r.status === 201, `status ${r.status} ${JSON.stringify(r.json)}`)
  thoren.activity = r.json.data.actividades.find(a => a.creada_por_integracion).id
})
await check('PATCH /activities/{id} → 200', async () => {
  const r = await api('PATCH', `/activities/${thoren.activity}`, T, { descripcion: 'Cliente pide llamar el lunes' })
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.json)}`)
})
await check('PATCH /opportunities/{id} → 200', async () => {
  const r = await api('PATCH', `/opportunities/${thoren.opp}`, T, { probabilidad: 40 })
  expect(r.status === 200 && r.json.data.probabilidad === 40, `status ${r.status} ${JSON.stringify(r.json)}`)
})
await check('GET /opportunities y /opportunities/{id} → 200', async () => {
  const l = await api('GET', '/opportunities', T)
  const d = await api('GET', `/opportunities/${thoren.opp}`, T)
  expect(l.status === 200 && d.status === 200, `status ${l.status}/${d.status}`)
})
await check('GET /lookup?rfc= → 200 con la empresa', async () => {
  const r = await api('GET', `/lookup?rfc=${rfc}`, T)
  expect(r.status === 200 && r.json.data.empresas.some(e => e.id === thoren.company), JSON.stringify(r.json))
})
await check('Sin acceso de análisis: GET /analytics/opportunities → 403 (sin cambio)', async () => {
  const r = await api('GET', '/analytics/opportunities', T)
  expect(r.status === 403, `status ${r.status}`)
})

// ─────────────────────────────────────────────────────────────────────
group = 'A. Lectura (VÄLKEN: análisis + historial, sin datos de contacto)'

await check('GET /analytics/opportunities/{id} → 200 con actividades, ids y descripción', async () => {
  const r = await api('GET', `/analytics/opportunities/${A1}`, V)
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.json)}`)
  const d = r.json.data
  expect(d.actividades.length === 2, `actividades ${d.actividades.length}`)
  expect('descripcion' in d.actividades[0] && d.actividades[0].vendedor?.id, 'faltan campos de actividad')
  expect(d.company_id === ACME && d.contact_id === ANA, 'company_id/contact_id')
  expect(d.business_unit === 'thunder_led', 'unidad')
  expect(d.actividades.some(a => a.descripcion?.includes('40 luminarias')), 'falta la descripción del vendedor')
  expect(d.contacto.email === null && d.contacto.telefono === null, 'PII expuesta sin permiso')
  expect(d.actividades[0].fecha <= d.actividades[1].fecha, 'orden cronológico')
  samples.opportunity_detail = r.json
  return `${d.actividades.length} actividades, unidad ${d.business_unit}, email contacto = null`
})
await check('GET /analytics/activities?opportunity_id= → 200, sólo esa oportunidad', async () => {
  const r = await api('GET', `/analytics/activities?opportunity_id=${A1}`, V)
  expect(r.status === 200, `status ${r.status}`)
  expect(r.json.data.total === 2 && r.json.data.actividades.every(a => a.opportunity_id === A1), JSON.stringify(r.json.data))
  samples.activities_by_opportunity = r.json
  return `total ${r.json.data.total}`
})
await check('Lee actividades de TODAS las unidades', async () => {
  const r = await api('GET', '/analytics/activities?limit=500', V)
  const units = [...new Set(r.json.data.actividades.map(a => a.business_unit))].sort()
  const dbUnits = sql(`select string_agg(distinct o.business_unit::text, ',' order by o.business_unit::text) from activities a join opportunities o on o.id=a.opportunity_id;`)
  expect(r.status === 200 && units.join(',') === dbUnits, `API ${units} vs DB ${dbUnits}`)
  const dbTotal = Number(sql('select count(*) from activities;'))
  expect(r.json.data.total === dbTotal, `total ${r.json.data.total} vs DB ${dbTotal}`)
  return `unidades: ${units.join(', ')} · ${dbTotal} actividades`
})
await check('Paginación: limit/offset recorren todo sin repetir', async () => {
  const total = (await api('GET', '/analytics/activities?limit=1', V)).json.data.total
  const ids = []
  for (let off = 0; off < total; off += 3) {
    const r = await api('GET', `/analytics/activities?limit=3&offset=${off}`, V)
    ids.push(...r.json.data.actividades.map(a => a.id))
  }
  expect(ids.length === total && new Set(ids).size === total, `${ids.length} ids, ${new Set(ids).size} únicos, total ${total}`)
  return `${total} actividades en páginas de 3`
})
await check('Filtros: unidad + tipo + estatus', async () => {
  const r = await api('GET', '/analytics/activities?unit=thunder_led&estatus=completada', V)
  const n = Number(sql(`select count(*) from activities a join opportunities o on o.id=a.opportunity_id where o.business_unit='thunder_led' and a.estatus='completada';`))
  expect(r.status === 200 && r.json.data.total === n, `API ${r.json.data?.total} vs DB ${n}`)
  expect(r.json.data.actividades.every(a => a.business_unit === 'thunder_led' && a.estatus === 'completada'), 'filas fuera del filtro')
  return `total ${n} (coincide con la DB)`
})
await check('Filtro por fechas (días de México, inclusivos) coincide con la DB', async () => {
  const r = await api('GET', '/analytics/activities?fecha=registro&desde=2026-01-01&hasta=2026-12-31', V)
  const n = Number(sql(`select count(*) from activities where created_at >= '2026-01-01T06:00:00Z' and created_at < '2027-01-01T06:00:00Z';`))
  expect(r.status === 200 && r.json.data.total === n, `API ${r.json.data?.total} vs DB ${n}`)
  return `fecha=registro 2026: ${n}`
})
await check('Filtro por empresa y por contacto', async () => {
  const c = await api('GET', `/analytics/activities?company_id=${ACME}`, V)
  const k = await api('GET', `/analytics/activities?contact_id=${ANA}`, V)
  expect(c.status === 200 && c.json.data.actividades.every(a => a.company_id === ACME), 'company_id')
  expect(k.status === 200 && k.json.data.actividades.every(a => a.contact_id === ANA), 'contact_id')
  return `empresa ${c.json.data.total}, contacto ${k.json.data.total}`
})
await check('GET /analytics/companies?q= → 200', async () => {
  const r = await api('GET', '/analytics/companies?q=acme', V)
  expect(r.status === 200 && r.json.data.empresas.some(e => e.id === ACME), JSON.stringify(r.json))
  samples.companies_search = r.json
  return `total ${r.json.data.total}`
})
await check('GET /analytics/companies/{id} → contactos y oportunidades', async () => {
  const r = await api('GET', `/analytics/companies/${ACME}`, V)
  expect(r.status === 200 && r.json.data.contactos.length > 0 && r.json.data.oportunidades.length > 0, JSON.stringify(r.json))
  expect(r.json.data.telefono === null, 'teléfono de empresa expuesto sin permiso')
  samples.company_detail = r.json
  return `${r.json.data.contactos.length} contactos, ${r.json.data.oportunidades.length} oportunidades`
})
await check('GET /analytics/contacts?company_id= → email/teléfono null sin permiso', async () => {
  const r = await api('GET', `/analytics/contacts?company_id=${ACME}`, V)
  expect(r.status === 200 && r.json.data.contactos.every(c => c.email === null && c.celular === null), JSON.stringify(r.json))
  samples.contacts_without_pii = r.json
})
await check('GET /analytics/contacts/{id} → oportunidades del contacto', async () => {
  const r = await api('GET', `/analytics/contacts/${ANA}`, V)
  expect(r.status === 200 && r.json.data.oportunidades.some(o => o.id === A1), JSON.stringify(r.json))
  samples.contact_detail = r.json
})
await check('Con "Ver email y teléfono" encendido → email visible', async () => {
  sql(`update integration_clients set can_read_contact_pii = true where nombre = '[E2E] VALKEN';`)
  try {
    const c = await api('GET', `/analytics/contacts/${ANA}`, V)
    const o = await api('GET', `/analytics/opportunities/${A1}`, V)
    const e = await api('GET', `/analytics/companies/${ACME}`, V)
    expect(c.json.data.email !== null && o.json.data.contacto.email !== null, 'email sigue null')
    expect(e.json.data.telefono === '8180000000', 'teléfono de empresa sigue null')
  } finally {
    sql(`update integration_clients set can_read_contact_pii = false where nombre = '[E2E] VALKEN';`)
  }
  return 'email del contacto y teléfono de la empresa presentes con el switch; se apagó de nuevo'
})
await check('Endpoints existentes de análisis siguen respondiendo igual', async () => {
  const l = await api('GET', '/analytics/opportunities?limit=2', V)
  const i = await api('GET', '/analytics/indicators', V)
  expect(l.status === 200 && Array.isArray(l.json.data.oportunidades) && !('company_id' in l.json.data.oportunidades[0]), 'forma cambiada')
  expect(i.status === 200 && i.json.data.indicadores, 'indicadores')
})

// ─────────────────────────────────────────────────────────────────────
group = 'B. Autorización'

await check('Sin header Authorization → 401', async () => {
  const r = await api('GET', '/analytics/activities')
  expect(r.status === 401, `status ${r.status}`)
})
await check('Key con formato inválido → 401', async () => {
  const r = await api('GET', '/analytics/activities', 'abc123')
  expect(r.status === 401, `status ${r.status}`)
})
await check('Key con formato válido pero inexistente → 401', async () => {
  const r = await api('GET', '/analytics/activities', 'sint_' + 'f'.repeat(64))
  expect(r.status === 401 && r.json.error === 'API key inválida o revocada', JSON.stringify(r.json))
  samples.error_401 = r.json
})
await check('Cliente con análisis pero SIN historial → 403 en los 6 endpoints nuevos', async () => {
  const paths = [`/analytics/opportunities/${A1}`, '/analytics/activities', '/analytics/companies', `/analytics/companies/${ACME}`, '/analytics/contacts', `/analytics/contacts/${ANA}`]
  const statuses = []
  for (const p of paths) statuses.push((await api('GET', p, KEYS.SINHIST_KEY)).status)
  expect(statuses.every(s => s === 403), statuses.join(','))
  const r = await api('GET', '/analytics/activities', KEYS.SINHIST_KEY)
  samples.error_403_history = r.json
  const l = await api('GET', '/analytics/opportunities', KEYS.SINHIST_KEY)
  expect(l.status === 200, 'análisis debería seguir en 200')
  return `${statuses.join(', ')} · /analytics/opportunities sigue en 200`
})
await check('Cliente sin análisis ni historial (réplica THÖREN) → 403', async () => {
  const r = await api('GET', `/analytics/opportunities/${A1}`, T)
  expect(r.status === 403, `status ${r.status}`)
})
await check('Apagar análisis a VÄLKEN corta también el historial → 403', async () => {
  sql(`update integration_clients set can_read_analytics = false where nombre = '[E2E] VALKEN';`)
  try {
    const r = await api('GET', '/analytics/activities', V)
    expect(r.status === 403, `status ${r.status}`)
  } finally {
    sql(`update integration_clients set can_read_analytics = true where nombre = '[E2E] VALKEN';`)
  }
})
await check('Oportunidad inexistente → 404; id no UUID → 422', async () => {
  const a = await api('GET', `/analytics/opportunities/${MISSING}`, V)
  const b = await api('GET', '/analytics/opportunities/abc', V)
  expect(a.status === 404 && b.status === 422, `${a.status}/${b.status}`)
  samples.error_404 = a.json
})
await check('Parámetro desconocido o limit > 500 → 422', async () => {
  const a = await api('GET', '/analytics/activities?estado=abierta', V)
  const b = await api('GET', '/analytics/activities?limit=501', V)
  expect(a.status === 422 && b.status === 422, `${a.status}/${b.status}`)
  samples.error_422 = a.json
})
await check('DELETE → 405', async () => {
  const r = await api('DELETE', `/analytics/opportunities/${A1}`, V)
  expect(r.status === 405, `status ${r.status}`)
})
await check('Límite de llamadas (cliente con 3/min) → 429 en la 4ª', async () => {
  const s = []
  for (let i = 0; i < 4; i++) s.push((await api('GET', '/analytics/companies', KEYS.LIMITE_KEY)).status)
  expect(s.join(',') === '200,200,200,429', s.join(','))
  samples.error_429 = (await api('GET', '/analytics/companies', KEYS.LIMITE_KEY)).json
  return s.join(', ')
})
await check('Key revocada → 401', async () => {
  sql(`select integration_revoke_key(id) from integration_clients where nombre = '[E2E] LIMITE';`)
  const r = await api('GET', '/analytics/companies', KEYS.LIMITE_KEY)
  expect(r.status === 401, `status ${r.status}`)
})
await check('Switch de dirección en la DB: rol no autorizado → rechazado; apagar análisis apaga historial y contacto', async () => {
  const vendedor = sql(`select id from profiles where role='vendedor' and is_active limit 1;`)
  // Literal: como vendedor la RLS oculta integration_clients y un "from integration_clients"
  // no llamaría a la función.
  const valkenId = sql(`select id from integration_clients where nombre = '[E2E] VALKEN';`)
  const out = sql(`
    begin;
    set local role authenticated;
    select set_config('request.jwt.claims', '{"sub":"00000001-0000-0000-0000-000000000000","role":"authenticated"}', true);
    select integration_set_read_permissions(id, false, true, true) from integration_clients where nombre = '[E2E] VALKEN';
    select can_read_analytics||'/'||can_read_contact_pii||'/'||can_read_history from integration_clients where nombre = '[E2E] VALKEN';
    rollback;`).split('\n').find(l => /^(true|false)\//.test(l))
  expect(out === 'false/false/false', `director: ${out}`)
  let denied = false
  try {
    sql(`begin; set local role authenticated;
      select set_config('request.jwt.claims', '{"sub":"${vendedor}","role":"authenticated"}', true);
      select integration_set_read_permissions('${valkenId}', true, true, true);
      rollback;`)
  } catch (e) { denied = /No autorizado/.test(String(e.stderr ?? e.message)) }
  expect(denied, 'el vendedor pudo cambiar permisos')
  return 'director: análisis=false fuerza contacto=false e historial=false · vendedor: "No autorizado"'
})

// ─────────────────────────────────────────────────────────────────────
group = 'C. Bloqueo de escritura (VÄLKEN, can_write = false)'
const before = counts()
const writes = [
  ['POST',  '/companies',                    { nombre: '[E2E] No debe existir', rfc: 'VAL' + Date.now().toString().slice(-9) }],
  ['POST',  '/contacts',                     { nombre: '[E2E] No debe existir', email: `valken-${Date.now()}@ejemplo.test` }],
  ['POST',  '/opportunities',                { nombre: '[E2E] No debe existir', next_activity_at: '2026-12-01T16:00:00-06:00' }],
  ['PATCH', `/opportunities/${thoren.opp}`,  { probabilidad: 90 }],
  ['POST',  '/activities',                   { opportunity_id: thoren.opp, tipo: 'email', titulo: '[E2E] No debe existir', fecha: '2026-12-01T16:00:00-06:00' }],
  ['PATCH', `/activities/${thoren.activity}`, { titulo: 'Modificado por VÄLKEN' }],
]
for (const [method, path, body] of writes) {
  await check(`${method} ${path.replace(/[0-9a-f-]{36}/, '{id}')} → 403`, async () => {
    const r = await api(method, path, V, body)
    expect(r.status === 403 && r.json.error === 'Esta integración es de sólo lectura', `status ${r.status} ${JSON.stringify(r.json)}`)
    samples.error_403_read_only ??= r.json
  })
}
await check('Ningún registro creado ni modificado (conteos y datos intactos)', async () => {
  const after = counts()
  expect(after === before, `antes ${before} · después ${after}`)
  const prob = sql(`select probabilidad from opportunities where id = '${thoren.opp}';`)
  const tit  = sql(`select titulo from activities where id = '${thoren.activity}';`)
  expect(prob === '40' && tit === '[E2E] Llamada', `prob ${prob}, título ${tit}`)
  return `empresas/contactos/oportunidades/actividades: ${before} → ${after}`
})
await check('Bloqueo validado en la DB: RPC directo con service_role → IN403', async () => {
  const r = await rpc('integration_create_company', { p_key_hash: hash(V), p_data: { nombre: '[E2E] directo' } })
  expect(r.json?.code === 'IN403', JSON.stringify(r))
  return `PostgREST ${r.status} · ${r.json.code}: ${r.json.message}`
})
await check('Las funciones *_impl no son invocables desde la API', async () => {
  const r = await rpc('integration_create_company_impl', { p_key_hash: hash(V), p_data: { nombre: '[E2E] directo' } })
  expect(r.status >= 400 && ['42501', 'PGRST202'].includes(r.json?.code), JSON.stringify(r))
  return `PostgREST ${r.status} · ${r.json.code}`
})
await check('Los intentos bloqueados quedan en la bitácora (ok = false)', async () => {
  const n = Number(sql(`select count(*) from integration_audit_log l join integration_clients c on c.id=l.client_id
                        where c.nombre='[E2E] VALKEN' and not l.ok and l.error like 'IN403: Esta integración es de sólo lectura%';`))
  expect(n >= writes.length, `sólo ${n} registros`)
  return `${n} intentos registrados`
})

// ─────────────────────────────────────────────────────────────────────
group = 'E. Auditoría de lecturas'
await check('Cada lectura de historial queda en integration_audit_log', async () => {
  const rows = sql(`select operacion||':'||count(*) from integration_audit_log l join integration_clients c on c.id=l.client_id
                    where c.nombre='[E2E] VALKEN' and l.ok group by operacion order by 1;`)
  expect(/history_activities/.test(rows) && /history_opportunity/.test(rows) && /history_contact:/.test(rows), rows)
  return rows.split('\n').join(' · ')
})

// ─────────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.ok).length
let md = `Ejecutado: ${new Date().toISOString()} · ${passed}/${results.length} casos OK\n`
let current = ''
for (const r of results) {
  if (r.group !== current) { current = r.group; md += `\n#### ${current}\n\n| Resultado | Caso | Detalle |\n|---|---|---|\n` }
  md += `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${String(r.detail).replace(/\|/g, '\\|').replace(/\n/g, ' ')} |\n`
}
if (outMd) writeFileSync(outMd, md)
if (outJson) writeFileSync(outJson, JSON.stringify(samples, null, 2))
console.log(md)
process.exit(passed === results.length ? 0 : 1)
