import { COLORS } from '@/lib/theme'

// Pantalla de carga mientras el servidor arma la página: el mismo
// degradé amarillo de las tarjetas del inicio, con la lupa negra.
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
        background: `linear-gradient(160deg, #FFD54A 0%, ${COLORS.clay} 100%)`,
        color: COLORS.onClay,
      }}
    >
      <svg
        className="lupa-cargando"
        width="72"
        height="72"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        role="img"
        aria-label="Cargando"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    </div>
  )
}
