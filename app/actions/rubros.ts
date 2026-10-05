'use server';

import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

// Rubros con sus categorías, para el megamenú de la cabecera web.
// Casi nunca cambian: quedan en caché del servidor una hora, así el menú
// abre al toque. No es un dato privado (son los nombres de los rubros), por
// eso se lee con el cliente de servicio, sin depender de la sesión.
export type RubroMenu = { slug: string; nombre: string; categorias: { slug: string; nombre: string }[] };

const leerRubros = unstable_cache(
  async (): Promise<RubroMenu[]> => {
    const { data, error } = await createAdminClient()
      .from('categorias_grupo')
      .select('slug, nombre, categorias ( slug, nombre )')
      .order('nombre');
    // Si falla, se tira el error para que no quede guardado un menú vacío
    if (error || !data) throw new Error(error?.message ?? 'Sin rubros');
    return (
      data
        .map((g) => ({
          slug: g.slug,
          nombre: g.nombre,
          categorias: [...((g.categorias ?? []) as { slug: string; nombre: string }[])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        }))
        // Un rubro sin categorías no lleva a nada: no se muestra
        .filter((g) => g.categorias.length > 0)
    );
  },
  ['rubros-menu'],
  { revalidate: 3600 }
);

export async function rubrosParaMenu(): Promise<RubroMenu[]> {
  try {
    return await leerRubros();
  } catch {
    return [];
  }
}
