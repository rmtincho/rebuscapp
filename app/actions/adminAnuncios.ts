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

// Lee y valida los campos del formulario (sirve para crear y para editar)
function leerCampos(formData: FormData, imagenObligatoria: boolean) {
  const anunciante = String(formData.get('anunciante') ?? '').trim();
  const espacio = String(formData.get('espacio') ?? '');
  const rubro = String(formData.get('rubro') ?? '').trim() || null;
  const enlace = String(formData.get('enlace') ?? '').trim() || null;
  const textoAlternativo = String(formData.get('texto_alternativo') ?? '').trim() || null;
  const desde = String(formData.get('desde') ?? '') || null;
  const hasta = String(formData.get('hasta') ?? '') || null;
  const archivo = formData.get('imagen');
  const imagen = archivo instanceof File && archivo.size > 0 ? archivo : null;

  let error: string | null = null;
  if (anunciante.length < 2) error = 'Poné el nombre del anunciante.';
  else if (!ESPACIOS_ANUNCIOS.some((e) => e.valor === espacio)) error = 'Elegí un espacio.';
  else if (enlace && !/^https?:\/\//.test(enlace)) error = 'El enlace tiene que empezar con https://';
  else if (desde && hasta && hasta < desde) error = 'La fecha "hasta" es anterior a "desde".';
  else if (!imagen && imagenObligatoria) error = 'Subí la imagen del anuncio.';
  else if (imagen && !TIPOS.includes(imagen.type)) error = 'La imagen tiene que ser JPG, PNG, WEBP o GIF.';
  else if (imagen && imagen.size > MAX_BYTES) error = 'La imagen pesa más de 3,5 MB. Achicala y probá de nuevo.';

  return {
    error,
    imagen,
    fila: { anunciante, espacio, rubro, enlace, texto_alternativo: textoAlternativo, desde, hasta },
  };
}

// Sube la imagen al bucket y devuelve su ruta y su URL pública
async function subirImagen(imagen: File, espacio: string) {
  const admin = createAdminClient();
  const extension = imagen.type.split('/')[1].replace('jpeg', 'jpg');
  const ruta = `${espacio}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await admin.storage.from('anuncios').upload(ruta, imagen, { contentType: imagen.type, upsert: false });
  if (error) return { error: error.message, ruta: null, url: null };
  return { error: null, ruta, url: admin.storage.from('anuncios').getPublicUrl(ruta).data.publicUrl };
}

// Ruta dentro del bucket a partir de la URL pública (null si no es nuestra)
function rutaDeUrl(url: string | null | undefined) {
  const marca = '/storage/v1/object/public/anuncios/';
  return url && url.includes(marca) ? url.split(marca)[1] : null;
}

export async function crearAnuncio(formData: FormData) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const { error, imagen, fila } = leerCampos(formData, true);
  if (error || !imagen) return { ok: false as const, error: error ?? 'Subí la imagen del anuncio.' };

  const subida = await subirImagen(imagen, fila.espacio);
  if (subida.error) {
    console.error('No se pudo subir la imagen del anuncio:', subida.error);
    return { ok: false as const, error: 'No pudimos subir la imagen: ' + subida.error };
  }

  const admin = createAdminClient();
  const { error: errorInsert } = await admin.from('anuncios').insert({ ...fila, imagen_url: subida.url });
  if (errorInsert) {
    await admin.storage.from('anuncios').remove([subida.ruta!]);
    console.error('No se pudo guardar el anuncio:', errorInsert.message);
    return { ok: false as const, error: 'No pudimos guardar el anuncio: ' + errorInsert.message };
  }

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}

// Editar: la imagen es opcional (si no se sube una nueva, queda la actual).
// Las impresiones y los clics se mantienen.
export async function editarAnuncio(id: string, formData: FormData) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const { error, imagen, fila } = leerCampos(formData, false);
  if (error) return { ok: false as const, error };

  const admin = createAdminClient();
  const { data: actual } = await admin.from('anuncios').select('imagen_url').eq('id', id).maybeSingle();
  if (!actual) return { ok: false as const, error: 'Ese anuncio ya no existe.' };

  let imagenUrl = actual.imagen_url as string;
  let rutaNueva: string | null = null;
  if (imagen) {
    const subida = await subirImagen(imagen, fila.espacio);
    if (subida.error) return { ok: false as const, error: 'No pudimos subir la imagen: ' + subida.error };
    imagenUrl = subida.url!;
    rutaNueva = subida.ruta;
  }

  const { error: errorUpdate } = await admin.from('anuncios').update({ ...fila, imagen_url: imagenUrl }).eq('id', id);
  if (errorUpdate) {
    if (rutaNueva) await admin.storage.from('anuncios').remove([rutaNueva]);
    return { ok: false as const, error: 'No pudimos guardar los cambios: ' + errorUpdate.message };
  }

  // Imagen reemplazada: borrar la anterior
  const rutaVieja = rutaNueva ? rutaDeUrl(actual.imagen_url) : null;
  if (rutaVieja) await admin.storage.from('anuncios').remove([rutaVieja]);

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
  const ruta = rutaDeUrl(anuncio?.imagen_url);
  if (ruta) await admin.storage.from('anuncios').remove([ruta]);

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}
