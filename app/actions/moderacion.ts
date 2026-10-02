'use server';

import { revalidatePath } from 'next/cache';
import { enviarPush } from '@/lib/push-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { MOTIVOS_DENUNCIA, etiquetaMotivo, type MotivoDenuncia } from '@/lib/denuncias';

// Denunciar y bloquear. Todo por el servidor con el cliente admin: quien
// denuncia o bloquea sale de la sesión, nunca de lo que manda el cliente.
// Necesita scripts/sql/2026-09-29-denuncias-bloqueos.sql.


const ERROR_SESION = 'Tu sesión expiró, volvé a loguearte.';

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Para denunciar hay que tener los datos personales completos (foto,
// nombre, apellido, edad y DNI): frena las denuncias de cuentas vacías.
// Edad y DNI solo se leen desde el servidor.
async function perfilCompleto(userId: string) {
  const { data } = await createAdminClient()
    .from('usuarios')
    .select('nombre, apellido, edad, dni, foto_perfil_url')
    .eq('id', userId)
    .maybeSingle();
  return !!(data?.nombre && data.apellido && data.edad && data.dni && data.foto_perfil_url);
}

export async function puedoDenunciar() {
  const user = await usuarioActual();
  if (!user) return { ok: false as const, error: ERROR_SESION };
  return { ok: true as const, perfilCompleto: await perfilCompleto(user.id) };
}

export async function denunciar(datos: {
  denunciadoId?: string;
  pedidoId?: string;
  motivo: MotivoDenuncia;
  detalle?: string;
}) {
  const user = await usuarioActual();
  if (!user) return { ok: false as const, error: ERROR_SESION };
  if (!(await perfilCompleto(user.id))) {
    return { ok: false as const, error: 'Para denunciar tenés que completar tu perfil.' };
  }

  if (!MOTIVOS_DENUNCIA.some((m) => m.valor === datos.motivo)) return { ok: false as const, error: 'Elegí un motivo.' };
  const detalle = String(datos.detalle ?? '').trim().slice(0, 500) || null;
  if (datos.motivo === 'otro' && !detalle) {
    return { ok: false as const, error: 'Contanos brevemente qué pasó.' };
  }

  const admin = createAdminClient();

  // Si denuncia un pedido, el denunciado es quien lo publicó
  let denunciadoId = datos.denunciadoId ?? null;
  let pedidoId: string | null = null;
  if (datos.pedidoId) {
    const { data: pedido } = await admin
      .from('pedidos')
      .select('id, solicitante_id')
      .eq('id', datos.pedidoId)
      .maybeSingle();
    if (!pedido) return { ok: false as const, error: 'No encontramos ese trabajo.' };
    pedidoId = pedido.id;
    denunciadoId = pedido.solicitante_id;
  }
  if (!denunciadoId) return { ok: false as const, error: 'No encontramos a quién denunciar.' };
  if (denunciadoId === user.id) return { ok: false as const, error: 'No podés denunciarte a vos mismo.' };

  // Una denuncia pendiente por persona (y pedido) alcanza
  let repetida = admin
    .from('denuncias')
    .select('id')
    .eq('denunciante_id', user.id)
    .eq('denunciado_id', denunciadoId)
    .eq('estado', 'pendiente');
  repetida = pedidoId ? repetida.eq('pedido_id', pedidoId) : repetida.is('pedido_id', null);
  const { data: yaExiste } = await repetida.limit(1).maybeSingle();
  if (yaExiste) return { ok: true as const };

  const { data: nueva, error } = await admin
    .from('denuncias')
    .insert({
      denunciante_id: user.id,
      denunciado_id: denunciadoId,
      pedido_id: pedidoId,
      motivo: datos.motivo,
      detalle,
    })
    .select('id')
    .single();
  if (error || !nueva) {
    console.error('No se pudo guardar la denuncia:', error?.message);
    return { ok: false as const, error: 'No pudimos enviar la denuncia. Probá de nuevo en un rato.' };
  }

  // Aviso a quien modera (MODERADOR_USUARIO_ID en las variables de entorno)
  const moderador = process.env.MODERADOR_USUARIO_ID;
  if (moderador) {
    await enviarPush({
      usuarioId: moderador,
      tipo: 'denuncia',
      titulo: 'Nueva denuncia',
      cuerpo: `${etiquetaMotivo(datos.motivo)}${pedidoId ? ' (trabajo)' : ' (usuario)'}`,
      // Al panel, con el detalle y el chat; el ancla abre esta denuncia
      urlDestino: `/admin/denuncias#d-${nueva.id}`,
    }).catch(() => {});
  }

  return { ok: true as const };
}

export async function bloquear(otroId: string) {
  const user = await usuarioActual();
  if (!user) return { ok: false as const, error: ERROR_SESION };
  if (typeof otroId !== 'string' || !otroId || otroId === user.id) {
    return { ok: false as const, error: 'No se puede bloquear a esta persona.' };
  }

  const { error } = await createAdminClient()
    .from('bloqueos')
    .upsert({ bloqueador_id: user.id, bloqueado_id: otroId }, { onConflict: 'bloqueador_id,bloqueado_id', ignoreDuplicates: true });
  if (error) {
    console.error('No se pudo bloquear:', error.message);
    return { ok: false as const, error: 'No pudimos bloquear a esta persona. Probá de nuevo en un rato.' };
  }

  revalidatePath('/', 'layout');
  return { ok: true as const };
}

export async function desbloquear(otroId: string) {
  const user = await usuarioActual();
  if (!user) return { ok: false as const, error: ERROR_SESION };

  const { error } = await createAdminClient()
    .from('bloqueos')
    .delete()
    .eq('bloqueador_id', user.id)
    .eq('bloqueado_id', otroId);
  if (error) {
    console.error('No se pudo desbloquear:', error.message);
    return { ok: false as const, error: 'No pudimos desbloquear a esta persona. Probá de nuevo en un rato.' };
  }

  revalidatePath('/', 'layout');
  return { ok: true as const };
}
