// Script para importar categorias.json a Supabase
// Uso: npx tsx scripts/importar-categorias.ts
// (si no tenés tsx: npm install -D tsx)

import { createClient } from '@supabase/supabase-js'
import categoriasData from '../categorias.json'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY! // clave con privilegios, solo para scripts de servidor — nunca en el frontend
)

async function importar() {
  console.log('Importando grupos de categorías...')

  for (const grupo of categoriasData.categorias) {
    const { error: errorGrupo } = await supabase
      .from('categorias_grupo')
      .upsert({
        slug: grupo.slug_grupo,
        nombre: grupo.grupo,
        advertencia: (grupo as any).advertencia ?? null,
      })

    if (errorGrupo) {
      console.error(`Error en grupo ${grupo.grupo}:`, errorGrupo.message)
      continue
    }

    console.log(`✓ Grupo: ${grupo.grupo}`)

    const items = grupo.items.map((item) => ({
      slug: item.slug,
      nombre: item.nombre,
      grupo_slug: grupo.slug_grupo,
      requiere_matricula: item.requiere_matricula,
    }))

    const { error: errorItems } = await supabase
      .from('categorias')
      .upsert(items)

    if (errorItems) {
      console.error(`  Error en categorías de ${grupo.grupo}:`, errorItems.message)
    } else {
      console.log(`  ✓ ${items.length} categorías importadas`)
    }
  }

  console.log('\n¡Listo! Importación terminada.')
}

importar()