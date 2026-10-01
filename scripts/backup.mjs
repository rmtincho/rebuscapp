// Copia de seguridad de Supabase a la compu (el plan gratis no tiene backups).
//
//   node scripts/backup.mjs
//
// Usa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY de .env.local y guarda
// todo en una carpeta con fecha FUERA del repo (../rebuscapp-backups), para
// que nunca se suba a GitHub: tiene DNI, mails y chats.
//
//   tablas/<tabla>.json    cada tabla de la base (esquema public)
//   auth-usuarios.json     las cuentas de login (mail, fecha, si está suspendida)
//   archivos/<bucket>/...  fotos de perfil, imágenes de anuncios, etc.
//   estructura.sql         solo si hay pg_dump instalado y SUPABASE_DB_URL en
//                          .env.local: la estructura completa (tablas, RLS,
//                          funciones), para poder reconstruir la base
//   resumen.json           cuántas filas y archivos se bajaron
//
// Restaurar es a mano: la estructura con estructura.sql (o scripts/sql) y los
// datos importando los JSON. Lo importante es no perderlos.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// .env.local sin dependencias: CLAVE=valor, con o sin comillas
const env = {}
for (const linea of readFileSync(join(raiz, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL_SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL
const CLAVE = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_SUPABASE || !CLAVE) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local')
  process.exit(1)
}

// Las claves nuevas (sb_secret_...) van solo en apikey; las viejas (JWT) también como Bearer
const headers = { apikey: CLAVE, ...(CLAVE.startsWith('eyJ') ? { Authorization: `Bearer ${CLAVE}` } : {}) }

async function pedir(ruta, opciones = {}) {
  const r = await fetch(`${URL_SUPABASE}${ruta}`, { ...opciones, headers: { ...headers, ...opciones.headers } })
  if (!r.ok) throw new Error(`${opciones.method ?? 'GET'} ${ruta} → ${r.status} ${await r.text()}`)
  return r
}

const ahora = new Date()
// Fecha y hora locales: 2026-09-30_2042
const dos = (n) => String(n).padStart(2, '0')
const sello = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}`
const destino = resolve(raiz, '..', 'rebuscapp-backups', sello)
mkdirSync(join(destino, 'tablas'), { recursive: true })
const resumen = { fecha: ahora.toISOString(), tablas: {}, usuariosAuth: 0, archivos: {}, estructura: false, errores: [] }

function guardar(ruta, datos) {
  mkdirSync(dirname(ruta), { recursive: true })
  writeFileSync(ruta, typeof datos === 'string' || datos instanceof Uint8Array ? datos : JSON.stringify(datos, null, 2))
}

// 1. Tablas: la lista sale del OpenAPI de la API (lo que expone el esquema public)
console.log(`Guardando en ${destino}\n`)
const openapi = await (await pedir('/rest/v1/')).json()
const tablas = Object.keys(openapi.definitions ?? {}).sort()
for (const tabla of tablas) {
  try {
    const filas = []
    for (let desde = 0; ; desde += 1000) {
      const r = await pedir(`/rest/v1/${encodeURIComponent(tabla)}?select=*`, {
        headers: { Range: `${desde}-${desde + 999}`, 'Range-Unit': 'items' },
      })
      const pagina = await r.json()
      filas.push(...pagina)
      if (pagina.length < 1000) break
    }
    guardar(join(destino, 'tablas', `${tabla}.json`), filas)
    resumen.tablas[tabla] = filas.length
    console.log(`  ${tabla}: ${filas.length}`)
  } catch (e) {
    resumen.errores.push(`tabla ${tabla}: ${e.message}`)
    console.error(`  ${tabla}: ERROR ${e.message}`)
  }
}

// 2. Cuentas de login
try {
  const usuarios = []
  for (let pagina = 1; ; pagina++) {
    const r = await (await pedir(`/auth/v1/admin/users?page=${pagina}&per_page=1000`)).json()
    usuarios.push(...(r.users ?? []))
    if ((r.users ?? []).length < 1000) break
  }
  guardar(join(destino, 'auth-usuarios.json'), usuarios)
  resumen.usuariosAuth = usuarios.length
  console.log(`\n  cuentas de login: ${usuarios.length}`)
} catch (e) {
  resumen.errores.push(`auth: ${e.message}`)
  console.error(`\n  cuentas de login: ERROR ${e.message}`)
}

// 3. Archivos de cada bucket (recorre las carpetas)
async function listar(bucket, prefijo) {
  const encontrados = []
  for (let offset = 0; ; offset += 100) {
    const r = await (
      await pedir(`/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: prefijo, limit: 100, offset }),
      })
    ).json()
    for (const item of r) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name
      // Sin id es una carpeta
      if (item.id) encontrados.push(ruta)
      else encontrados.push(...(await listar(bucket, ruta)))
    }
    if (r.length < 100) break
  }
  return encontrados
}

try {
  const buckets = await (await pedir('/storage/v1/bucket')).json()
  console.log('')
  for (const { id: bucket } of buckets) {
    const rutas = await listar(bucket, '')
    let bajados = 0
    for (const ruta of rutas) {
      try {
        const r = await pedir(`/storage/v1/object/${bucket}/${ruta.split('/').map(encodeURIComponent).join('/')}`)
        guardar(join(destino, 'archivos', bucket, ...ruta.split('/')), new Uint8Array(await r.arrayBuffer()))
        bajados++
      } catch (e) {
        resumen.errores.push(`archivo ${bucket}/${ruta}: ${e.message}`)
      }
    }
    resumen.archivos[bucket] = bajados
    console.log(`  archivos ${bucket}: ${bajados} de ${rutas.length}`)
  }
} catch (e) {
  resumen.errores.push(`storage: ${e.message}`)
  console.error(`  archivos: ERROR ${e.message}`)
}

// 4. Estructura completa, si se puede (pg_dump + cadena de conexión)
if (env.SUPABASE_DB_URL) {
  try {
    execFileSync('pg_dump', ['--schema-only', '--no-owner', '--no-privileges', '-f', join(destino, 'estructura.sql'), env.SUPABASE_DB_URL], {
      stdio: 'inherit',
    })
    resumen.estructura = true
    console.log('\n  estructura.sql: ok')
  } catch (e) {
    resumen.errores.push(`pg_dump: ${e.message}`)
    console.error('\n  estructura.sql: no se pudo (¿pg_dump instalado?)')
  }
}

guardar(join(destino, 'resumen.json'), resumen)
console.log(
  resumen.errores.length
    ? `\nTerminó con ${resumen.errores.length} error(es): ver resumen.json`
    : '\nListo, sin errores.'
)
