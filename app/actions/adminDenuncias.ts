'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { usuarioAdmin } from '@/lib/admin';

// Panel de admin → denuncias. Como en anuncios, cada acción vuelve a
// chequear que quien la llama sea admin.

const NO_AUTORIZADO = { ok: false as const, error: 'No tenés permiso para esto.' };

// Cierra una denuncia anotando qué se decidió (queda en los antecedentes)
export async function cerrarDenuncia(id: string, resolucion: string) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const texto = String(resolucion ?? '').trim().slice(0, 500);
  if (!texto) return { ok: false as const, error: 'Anotá qué se decidió.' };

  const { error } = await createAdminClient()
    .from('denuncias')
    .update({ estado: 'revisada', resolucion: texto })
    .eq('id', id);
  if (error) {
    console.error('No se pudo cerrar la denuncia:', error.message);
    return { ok: false as const, error: 'No se pudo cerrar la denuncia.' };
  }

  revalidatePath('/admin/denuncias');
  return { ok: true as const };
}
