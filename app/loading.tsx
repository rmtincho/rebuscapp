import { COLORS } from '@/lib/theme'

// Pantalla de carga mientras el servidor arma la página: el degradé
// amarillo de marca con la lupa negra del logo (public/icono-negro.png).
export default function Cargando() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.clayGradient,
        color: COLORS.onClay,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen local fija, sin optimizar a propósito para que aparezca al instante */}
      <img className="lupa-cargando" src="/icono-negro.png" alt="Cargando" width={64} height={100} />
    </div>
  )
}
