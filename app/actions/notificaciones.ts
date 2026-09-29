'use server';

import { enviarPush } from '@/lib/push-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { idsConBloqueo } from '@/lib/bloqueos';

// Las server actions son endpoints públicos: cualquiera con sesión las
// puede llamar con los argumentos que quiera. Por eso acá NO confiamos
// en nada de lo que manda el cliente salvo IDs: quién dispara la acción
// sale de la sesión, y el texto del push sale de la base.

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Se llama desde PostularseForm.tsx después de insertar la postulación.
export async function notificarPostulacionRecibida(pedidoId: string) {
  const user = await usuarioActual();
  if (!user) return;

  const supabase = createAdminClient();

  // Solo avisamos si de verdad existe la postulación de este usuario
  const { data: postulacion } = await supabase
    .from('postulaciones')
    .select('id')
    .eq('pedido_id', pedidoId)
    .eq('prestador_id', user.id)
    .maybeSingle();

  if (!postulacion) return;

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('solicitante_id')
    .eq('id', pedidoId)
    .maybeSingle();

  if (!pedido) return;

  const { data: prestador } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle();

  const nombrePrestador = prestador?.nombre ?? 'Alguien';

  await enviarPush({
    usuarioId: pedido.solicitante_id,
    tipo: 'postulacion_recibida',
    titulo: 'Nueva postulación',
    cuerpo: `${nombrePrestador} se postuló a tu pedido`,
    urlDestino: `/pedidos/${pedidoId}`,
  });
}

// Se llama desde ChatVentana.tsx después de insertar un mensaje.
// El contenido del push es el último mensaje que el usuario logueado
// le mandó al receptor en este pedido (leído de la base), así nadie
// puede mandar notificaciones con texto o remitente inventados.
export async function notificarMensajeNuevo(pedidoId: string, receptorId: string) {
  const user = await usuarioActual();
  if (!user) return;

  const supabase = createAdminClient();

  const { data: mensaje } = await supabase
    .from('mensajes')
    .select('contenido')
    .eq('pedido_id', pedidoId)
    .eq('emisor_id', user.id)
    .eq('receptor_id', receptorId)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!mensaje) return;

  const { data: emisor } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle();

  const contenido: string = mensaje.contenido ?? '';
  // Recortamos el contenido para que la notificación no quede gigante
  const preview = contenido.length > 80 ? contenido.slice(0, 80) + '…' : contenido;

  // Hay dos pantallas de chat: /chat es el del trabajo ya asignado
  // (solicitante ↔ trabajador elegido) y /chat/<otro> es el que se usa
  // con cada postulante. Desde el lado del receptor, "el otro" es quien
  // mandó el mensaje.
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado, solicitante_id, prestador_asignado_id')
    .eq('id', pedidoId)
    .maybeSingle();

  const esChatDelAsignado =
    !!pedido &&
    pedido.estado !== 'abierto' &&
    [user.id, receptorId].includes(pedido.solicitante_id) &&
    [user.id, receptorId].includes(pedido.prestador_asignado_id);

  await enviarPush({
    usuarioId: receptorId,
    tipo: 'mensaje_nuevo',
    titulo: emisor?.nombre ?? 'Mensaje nuevo',
    cuerpo: preview,
    urlDestino: esChatDelAsignado ? `/pedidos/${pedidoId}/chat` : `/pedidos/${pedidoId}/chat/${user.id}`,
  });
}

// Se llama desde PublicarPedidoForm.tsx después de publicar un pedido.
// MVP: notifica a TODOS los prestadores que tengan esta categoría entre
// sus "categorías de interés" (prestador_categorias), sin filtrar por
// zona todavía — se puede sumar el filtro de distancia más adelante
// sin tocar esta función, en cuanto el prestador tenga ubicación guardada.
export async function notificarPedidoCerca(pedidoId: string) {
  const user = await usuarioActual();
  if (!user) return;

  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('solicitante_id, categoria_slug, categorias ( nombre )')
    .eq('id', pedidoId)
    .maybeSingle();

  // Solo el que publicó el pedido puede disparar el aviso
  if (!pedido || pedido.solicitante_id !== user.id) return;

  const categoria = pedido.categorias as { nombre: string } | { nombre: string }[] | null;
  const categoriaNombre =
    (Array.isArray(categoria) ? categoria[0]?.nombre : categoria?.nombre) ?? 'tu rubro';

  const { data: interesados } = await supabase
    .from('prestador_categorias')
    .select('prestador_id')
    .eq('categoria_slug', pedido.categoria_slug);

  if (!interesados || interesados.length === 0) return;

  // Evitamos notificarle a alguien su propio pedido (por si publica y
  // también tiene esa categoría entre sus intereses como prestador)
  // ...ni a quien tiene un bloqueo con quien lo publicó
  const bloqueados = await idsConBloqueo(user.id);
  const destinatarios = interesados
    .map((i) => i.prestador_id)
    .filter((id) => id !== user.id && !bloqueados.has(id));

  // Mandamos los push en paralelo, pero sin que uno que falle tumbe
  // a los demás.
  await Promise.allSettled(
    destinatarios.map((prestadorId) =>
      enviarPush({
        usuarioId: prestadorId,
        tipo: 'pedido_cerca',
        titulo: 'Nuevo trabajo cerca tuyo',
        cuerpo: `Se publicó un trabajo de ${categoriaNombre}`,
        urlDestino: `/pedidos/${pedidoId}`,
      })
    )
  );
}

// Se llama desde EditarPedidoForm.tsx después de guardar cambios.
// Avisa a todos los que tienen una postulación pendiente en este
// pedido (mientras está abierto, todas sus postulaciones son
// 'pendiente' — recién cambian de estado cuando se elige a alguien).
export async function notificarPedidoEditado(pedidoId: string) {
  const user = await usuarioActual();
  if (!user) return;

  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('solicitante_id, descripcion')
    .eq('id', pedidoId)
    .maybeSingle();

  if (!pedido || pedido.solicitante_id !== user.id) return;

  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select('prestador_id')
    .eq('pedido_id', pedidoId)
    .eq('estado', 'pendiente');

  if (!postulaciones || postulaciones.length === 0) return;

  const descripcion: string = pedido.descripcion ?? '';
  const preview = descripcion.length > 60 ? descripcion.slice(0, 60) + '…' : descripcion;

  await Promise.allSettled(
    postulaciones.map((p) =>
      enviarPush({
        usuarioId: p.prestador_id,
        tipo: 'pedido_editado',
        titulo: 'Un pedido al que te postulaste cambió',
        cuerpo: preview,
        urlDestino: `/pedidos/${pedidoId}`,
      })
    )
  );
}
