'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { activarNotificaciones } from '@/lib/push-client';

// Paso 4 de 4 del registro. Redirige a completar el perfil.
const RUTA_SIGUIENTE = '/perfil/prestador';

export default function NotificacionesRegistroPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivar() {
    setCargando(true);
    setError(null);

    const resultado = await activarNotificaciones();

    setCargando(false);

    if (resultado.ok) {
      router.push(RUTA_SIGUIENTE);
      return;
    }

    if (resultado.motivo === 'permiso_denegado') {
      // El usuario tocó "bloquear" en el popup del navegador.
      // No lo trabamos: sigue igual, solo sin push (le queda la
      // notificación pasiva dentro de la app).
      router.push(RUTA_SIGUIENTE);
      return;
    }

    if (resultado.motivo === 'no_soportado') {
      // Safari en iOS sin la PWA instalada, navegador viejo, etc.
      // Tampoco lo trabamos.
      router.push(RUTA_SIGUIENTE);
      return;
    }

    // Error real (ej: falló el guardado en Supabase) — mostramos
    // aviso pero igual dejamos avanzar, no vale la pena trabar el
    // registro por esto.
    setError('No pudimos activar las notificaciones ahora. Podés intentarlo después desde Configuración.');
  }

  function handleAhoraNo() {
    router.push(RUTA_SIGUIENTE);
  }

  return (
    <div
      style={{
        background: '#FAF7F2',
        color: '#1C1C22',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 24px 24px',
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 24 }}>Paso 4 de 4</p>

        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'rgba(226, 105, 28, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '12px 0 28px',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A6100"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 40, height: 40 }}
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-poppins, sans-serif)',
            fontWeight: 600,
            fontSize: 25,
            lineHeight: 1.3,
            marginBottom: 12,
          }}
        >
          No te pierdas ningún trabajo
        </h1>

        <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 28 }}>
          Activá las notificaciones para enterarte al instante, aunque no tengas la app abierta.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 'auto' }}>
          <ItemNotificacion
            icono={
              <svg viewBox="0 0 24 24" fill="none" stroke="#1C1C22" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            }
            titulo="Trabajos cerca tuyo"
            texto="Cuando alguien necesita lo que vos ofrecés, en tu zona"
          />
          <ItemNotificacion
            icono={
              <svg viewBox="0 0 24 24" fill="none" stroke="#1C1C22" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            titulo="Mensajes nuevos"
            texto="Cuando te escriben en el chat de un trabajo"
          />
          <ItemNotificacion
            icono={
              <svg viewBox="0 0 24 24" fill="none" stroke="#1C1C22" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            titulo="Postulaciones"
            texto="Cuando alguien se postula a tu trabajo, o cuando te eligen a vos"
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#C0392B', textAlign: 'center', marginTop: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
          <button
            onClick={handleActivar}
            disabled={cargando}
            style={{
              background: '#FFC21A',
              color: '#1C1C22',
              border: 'none',
              borderRadius: 14,
              padding: 16,
              fontSize: 16,
              fontWeight: 600,
              cursor: cargando ? 'default' : 'pointer',
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? 'Activando...' : 'Activar notificaciones'}
          </button>

          <button
            onClick={handleAhoraNo}
            disabled={cargando}
            style={{
              background: 'transparent',
              color: '#1C1C22',
              border: 'none',
              padding: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ahora no
          </button>

          <p style={{ fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
            Podés cambiar esto después desde Configuración
          </p>
        </div>
      </div>
    </div>
  );
}

function ItemNotificacion({
  icono,
  titulo,
  texto,
}: {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 1px 3px rgba(28, 28, 34, 0.06)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: '#FAF7F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icono}
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          {titulo}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.4 }}>{texto}</p>
      </div>
    </div>
  );
}