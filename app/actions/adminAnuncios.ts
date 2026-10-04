'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { usuarioAdmin } from '@/lib/admin';
import { ESPACIOS_ANUNCIOS, FORMATOS_ANUNCIO, formatosPara, type ColumnaImagen } from '@/lib/espaciosAnuncios';
import { armarEnlace, type AccionAnuncio } from '@/lib/enlaceAnuncio';

// Panel de admin → anuncios. Cada acción vuelve a chequear que quien la
// llama sea admin: que el formulario solo se muestre a admins no alcanza.

const MAX_BYTES = 3.5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const NO_AUTORIZADO = { ok: false as const, error: 'No tenés permiso para esto.' };
const FALTA_MIGRACION = 'Falta correr scripts/sql/2026-10-04-anuncios-ubicaciones.sql en Supabase.';

const COLUMNAS_IMAGEN = FORMATOS_ANUNCIO.map((f) => f.columna);

// Lee y valida los campos del formulario (sirve para crear y para editar).
// Las imágenes se validan aparte, porque al editar pueden quedar las de antes.
function leerCampos(formData: FormData) {
  const anunciante = String(formData.get('anunciante') ?? '').trim() || null;
  const espacios = formData
    .getAll('espacios')
    .map(String)
    .filter((e) => ESPACIOS_ANUNCIOS.some((x) => x.valor === e));
  const rubro = String(formData.get('rubro') ?? '').trim() || null;
  const textoAlternativo = String(formData.get('texto_alternativo') ?? '').trim() || null;
  const desde = String(formData.get('desde') ?? '') || null;
  const hasta = String(formData.get('hasta') ?? '') || null;
  const { enlace, error: errorEnlace } = armarEnlace({
    accion: (String(formData.get('accion') ?? 'nada') as AccionAnuncio) || 'nada',
    url: String(formData.get('url') ?? ''),
    numero: String(formData.get('numero') ?? ''),
    mensaje: String(formData.get('mensaje') ?? ''),
  });

  // Una imagen nueva por formato (solo los que se subieron)
  const imagenes: { columna: ColumnaImagen; archivo: File }[] = [];
  for (const f of FORMATOS_ANUNCIO) {
    const archivo = formData.get(f.campo);
    if (archivo instanceof File && archivo.size > 0) imagenes.push({ columna: f.columna, archivo });
  }

  let error: string | null = null;
  if (anunciante && anunciante.length < 2) error = 'El nombre del negocio es muy corto.';
  else if (espacios.length === 0) error = 'Elegí al menos una ubicación.';
  else if (errorEnlace) error = errorEnlace;
  else if (desde && hasta && hasta < desde) error = 'La fecha "hasta" es anterior a "desde".';
  else if (imagenes.some((i) => !TIPOS.includes(i.archivo.type))) error = 'Las imágenes tienen que ser JPG, PNG, WEBP o GIF.';
  else if (imagenes.some((i) => i.archivo.size > MAX_BYTES)) error = 'Alguna imagen pesa más de 3,5 MB. Achicala y probá de nuevo.';

  return {
    error,
    imagenes,
    // `espacio` (la columna vieja) queda con la primera ubicación
    fila: { anunciante, espacios, espacio: espacios[0], rubro, enlace, texto_alternativo: textoAlternativo, desde, hasta },
  };
}

// Formatos que esas ubicaciones necesitan y no tienen imagen
function imagenesFaltantes(espacios: string[], tiene: (columna: ColumnaImagen) => boolean) {
  return formatosPara(espacios).filter((f) => !tiene(f.columna));
}

// Sube la imagen al bucket y devuelve su ruta y su URL pública
async function subirImagen(imagen: File, carpeta: string) {
  const admin = createAdminClient();
  const extension = imagen.type.split('/')[1].replace('jpeg', 'jpg');
  const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await admin.storage.from('anuncios').upload(ruta, imagen, { contentType: imagen.type, upsert: false });
  if (error) return { error: error.message, ruta: null, url: null };
  return { error: null, ruta, url: admin.storage.from('anuncios').getPublicUrl(ruta).data.publicUrl };
}

// Sube todas las imágenes nuevas. Si una falla, borra las que ya subió.
async function subirImagenes(imagenes: { columna: ColumnaImagen; archivo: File }[]) {
  const urls: Partial<Record<ColumnaImagen, string>> = {};
  const rutas: string[] = [];
  for (const { columna, archivo } of imagenes) {
    const subida = await subirImagen(archivo, columna);
    if (subida.error) {
      await borrarRutas(rutas);
      return { error: subida.error, urls, rutas: [] };
    }
    urls[columna] = subida.url!;
    rutas.push(subida.ruta!);
  }
  return { error: null, urls, rutas };
}

// Ruta dentro del bucket a partir de la URL pública (null si no es nuestra)
function rutaDeUrl(url: string | null | undefined) {
  const marca = '/storage/v1/object/public/anuncios/';
  return url && url.includes(marca) ? url.split(marca)[1] : null;
}

async function borrarRutas(rutas: (string | null)[]) {
  const validas = rutas.filter((r): r is string => !!r);
  if (validas.length > 0) await createAdminClient().storage.from('anuncios').remove(validas);
}

function mensajeError(mensaje: string) {
  return /espacios|imagen_(horizontal|lateral)_url/.test(mensaje) ? FALTA_MIGRACION : mensaje;
}

export async function crearAnuncio(formData: FormData) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const { error, imagenes, fila } = leerCampos(formData);
  if (error) return { ok: false as const, error };

  const faltan = imagenesFaltantes(fila.espacios, (c) => imagenes.some((i) => i.columna === c));
  if (faltan.length > 0) {
    return { ok: false as const, error: `Falta la imagen ${faltan.map((f) => `${f.label} (${f.medida})`).join(' y ')}.` };
  }

  const subida = await subirImagenes(imagenes);
  if (subida.error) return { ok: false as const, error: 'No pudimos subir la imagen: ' + subida.error };

  const { error: errorInsert } = await createAdminClient().from('anuncios').insert({ ...fila, ...subida.urls });
  if (errorInsert) {
    await borrarRutas(subida.rutas);
    console.error('No se pudo guardar el anuncio:', errorInsert.message);
    return { ok: false as const, error: 'No pudimos guardar el anuncio: ' + mensajeError(errorInsert.message) };
  }

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}

// Editar: las imágenes son opcionales (si no se sube una nueva, queda la
// actual). Las impresiones y los clics se mantienen.
export async function editarAnuncio(id: string, formData: FormData) {
  if (!(await usuarioAdmin())) return NO_AUTORIZADO;
  const { error, imagenes, fila } = leerCampos(formData);
  if (error) return { ok: false as const, error };

  const admin = createAdminClient();
  const { data: actual, error: errorLectura } = await admin
    .from('anuncios')
    .select(COLUMNAS_IMAGEN.join(', '))
    .eq('id', id)
    .maybeSingle<Record<ColumnaImagen, string | null>>();
  if (errorLectura) return { ok: false as const, error: mensajeError(errorLectura.message) };
  if (!actual) return { ok: false as const, error: 'Ese anuncio ya no existe.' };

  const faltan = imagenesFaltantes(fila.espacios, (c) => !!actual[c] || imagenes.some((i) => i.columna === c));
  if (faltan.length > 0) {
    return { ok: false as const, error: `Falta la imagen ${faltan.map((f) => `${f.label} (${f.medida})`).join(' y ')}.` };
  }

  const subida = await subirImagenes(imagenes);
  if (subida.error) return { ok: false as const, error: 'No pudimos subir la imagen: ' + subida.error };

  const { error: errorUpdate } = await admin.from('anuncios').update({ ...fila, ...subida.urls }).eq('id', id);
  if (errorUpdate) {
    await borrarRutas(subida.rutas);
    return { ok: false as const, error: 'No pudimos guardar los cambios: ' + mensajeError(errorUpdate.message) };
  }

  // Imágenes reemplazadas: borrar las anteriores
  await borrarRutas(imagenes.map((i) => rutaDeUrl(actual[i.columna])));

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
  const { data: anuncio } = await admin
    .from('anuncios')
    .select(COLUMNAS_IMAGEN.join(', '))
    .eq('id', id)
    .maybeSingle<Record<ColumnaImagen, string | null>>();
  const { error } = await admin.from('anuncios').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  // Borrar también las imágenes, si son de nuestro bucket
  if (anuncio) await borrarRutas(COLUMNAS_IMAGEN.map((c) => rutaDeUrl(anuncio[c])));

  revalidatePath('/admin/anuncios');
  return { ok: true as const };
}
