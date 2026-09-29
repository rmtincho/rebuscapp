'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// El banner avisa cuando se vio en pantalla. Solo suma 1 al total del
// anuncio: no se guarda quién lo vio.
export async function registrarImpresion(anuncioId: string) {
  if (typeof anuncioId !== 'string' || !/^[0-9a-f-]{36}$/i.test(anuncioId)) return;
  await createAdminClient().rpc('contar_anuncio', { anuncio_id: anuncioId, es_clic: false });
}
