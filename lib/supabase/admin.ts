// Cliente de Supabase con la SERVICE ROLE KEY.
// Se salta RLS por completo — por eso NUNCA se importa desde código
// que corra en el navegador, solo desde server actions o route handlers.
//
// Se usa acá porque enviarPush() necesita leer las suscripciones push
// de cualquier usuario (no solo las del usuario logueado), y también
// insertar notificaciones "en nombre de" otro usuario (ej: avisarle
// al solicitante que llegó una postulación, aunque quien dispara la
// acción sea el prestador).

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // SUPABASE_SECRET_KEY es el nombre que usa .env.local (y el script de
  // importar categorías); SUPABASE_SERVICE_ROLE_KEY queda como alternativa.
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en las variables de entorno'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // no necesita persistir sesión, es un cliente de servidor
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}