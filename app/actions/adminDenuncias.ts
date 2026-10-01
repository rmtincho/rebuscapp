'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { usuarioAdmin } from '@/lib/admin';
import { enviarPush } from '@/lib/push-server';
import { AVISOS_DENUNCIA, type AvisoDenuncia } from '@/lib/denuncias';

// Panel de admin → denuncias. Como en anuncios, cada acción vuelve a
// chequear que quien la llama sea admin.

const NO_AUTORIZADO = { ok: false as const, error: 'No tenés permiso para esto.' };

// Cierra una denuncia anotando qué se decidió (queda en los antecedentes).
// `aviso`: qué le llega a quien denunció (lib/denuncias.ts). Nunca la
// sanción concreta, para no exponer a la otra persona.
export async function cerrarDenuncia(id: string, resolucion: string, aviso: AvisoDenuncia) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const texto = String(resolucion ?? '').trim().slice(0, 500);
  if (!texto) return { ok: false as const, error: 'Anotá qué se decidió.' };

  const { data: denuncia, error } = await createAdminClient()
    .from('denuncias')
    .update({ estado: 'revisada', resolucion: texto })
    .eq('id', id)
    .select('denunciante_id')
    .single();
  if (error || !denuncia) {
    console.error('No se pudo cerrar la denuncia:', error?.message);
    return { ok: false as const, error: 'No se pudo cerrar la denuncia.' };
  }

  const cuerpo = AVISOS_DENUNCIA.find((a) => a.valor === aviso)?.cuerpo;
  if (cuerpo) {
    await enviarPush({
      usuarioId: denuncia.denunciante_id,
      tipo: 'denuncia',
      titulo: 'Revisamos tu denuncia',
      cuerpo,
    }).catch(() => {});
  }

  revalidatePath('/admin/denuncias');
  return { ok: true as const };
}
