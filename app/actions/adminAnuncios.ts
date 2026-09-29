'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { usuarioAdmin } from '@/lib/admin';
import { ESPACIOS_ANUNCIOS } from '@/lib/espaciosAnuncios';

// Panel de admin → anuncios. Cada acción vuelve a chequear que quien la
// llama sea admin: que el formulario solo se muestre a admins no alcanza.

const MAX_BYTES = 3.5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const NO_AUTORIZADO = { ok: false as const, error: 'No tenés permiso para esto.' };

export async function crearAnuncio(formData: FormData) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;

  const anunciante = String(formData.get('anunciante') ?? '').trim();
  const espacio = String(formData.get('espacio') ?? '');
  const rubro = String(formData.get('rubro') ?? '').trim() || null;
  const enlace = String(formData.get('enlace') ?? '').trim() || null;
  const textoAlternativo = String(formData.get('texto_alternativo') ?? '').trim() || null;
  const desde = String(formData.get('desde') ?? '') || null;
  const hasta = String(formData.get('hasta') ?? '') || null;
  const imagen = formData.get('imagen');

  if (anunciante.length < 2) return { ok: false as const, error: 'Poné el nombre del anunciante.' };
  if (!ESPACIOS_ANUNCIOS.some((e) => e.valor === espacio)) return { ok: false as const, error: 'Elegí un espacio.' };
  if (enlace && !/^https?:\/\//.test(enlace)) return { ok: false as const, error: 'El enlace tiene que empezar con https://' };
  if (desde && hasta && hasta < desde) return { ok: false as const, error: 'La fecha "hasta" es anterior a "desde".' };
  if (!(imagen instanceof File) || imagen.size === 0) return { ok: false as const, error: 'Subí la imagen del anuncio.' };
  if (!TIPOS.includes(imagen.type)) return { ok: false as const, error: 'La imagen tiene que ser JPG, PNG, WEBP o GIF.' };
  if (imagen.size > MAX_BYTES) return { ok: false as const, error: 'La imagen pesa más de 3,5 MB. Achicala y probá de nuevo.' };

  const admin = createAdminClient();
  const extension = imagen.type.split('/')[1].replace('jpeg', 'jpg');
  const ruta = `${espacio}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: errorSubida } = await admin.storage
    .from('anuncios')
    .upload(ruta, imagen, { contentType: imagen.type, upsert: false });
  if (errorSubida) {
    console.error('No se pudo subir la imagen del anuncio:', errorSubida.message);
    return { ok: false as const, error: 'No pudimos subir la imagen: ' + errorSubida.message };
  }
  const { data: publica } = admin.storage.from('anuncios').getPublicUrl(ruta);

  const { error } = await admin.from('anuncios').insert({
    anunciante,
    espacio,
    rubro,
    enlace,
    texto_alternativo: textoAlternativo,
    desde,
    hasta,
    imagen_url: publica.publicUrl,
  });
  if (error) {
    await admin.storage.from('anuncios').remove([ruta]);
    console.error('No se pudo guardar el anuncio:', error.message);
    return { ok: false as const, error: 'No pudimos guardar el anuncio: ' + error.message };
  }

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}

export async function cambiarActivoAnuncio(id: string, activo: boolean) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const { error } = await createAdminClient().from('anuncios').update({ activo: !!activo }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}

export async function eliminarAnuncio(id: string) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const admin = createAdminClient();
  const { data: anuncio } = await admin.from('anuncios').select('imagen_url').eq('id', id).maybeSingle();
  const { error } = await admin.from('anuncios').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  // Borrar también la imagen, si es de nuestro bucket
  const marca = '/storage/v1/object/public/anuncios/';
  const url = anuncio?.imagen_url ?? '';
  if (url.includes(marca)) await admin.storage.from('anuncios').remove([url.split(marca)[1]]);

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}
