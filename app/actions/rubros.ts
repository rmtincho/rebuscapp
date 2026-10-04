'use server';

import { createClient } from '@/lib/supabase/server';

// Rubros con sus categorías, para el megamenú de la cabecera web. Lo pide
// el navegador la primera vez que se abre el menú.
export type RubroMenu = { slug: string; nombre: string; categorias: { slug: string; nombre: string }[] };

export async function rubrosParaMenu(): Promise<RubroMenu[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categorias_grupo')
    .select('slug, nombre, categorias ( slug, nombre )')
    .order('nombre');
  if (error || !data) return [];
  return data.map((g) => ({
    slug: g.slug,
    nombre: g.nombre,
    categorias: [...((g.categorias ?? []) as { slug: string; nombre: string }[])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  }));
}
