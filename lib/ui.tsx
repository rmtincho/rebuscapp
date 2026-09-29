import { COLORS } from './theme'
import React from 'react'

// ============================================================
// Un solo lugar donde se define cómo se ve cada elemento de la
// interfaz. Las pantallas usan estos componentes en vez de
// reinventar los estilos cada vez — así un título siempre es un
// título, en todos lados, sin riesgo de que a alguno se le olvide
// el color.
// ============================================================

export function PantallaBase({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', background: COLORS.paper, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}

export function TituloPagina({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
        color: COLORS.ink,
        margin: '16px 0 6px',
      }}
    >
      {children}
    </h1>
  )
}

export function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 24 }}>
      {children}
    </p>
  )
}

// Título de sección dentro de un formulario/pantalla (ej. "Requisitos", "¿Dónde es?")
export function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 13.5,
        fontWeight: 700,
        color: COLORS.ink,
        marginBottom: 10,
      }}
    >
      {children}
    </label>
  )
}

// Etiqueta secundaria, más chica, subordinada a un TituloSeccion (ej. "Nivel educativo requerido" dentro de "Requisitos")
export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 10, fontWeight: 600 }}>
      {children}
    </p>
  )
}

// El "eyebrow" chico en mayúsculas (ej. "3 PEDIDOS CERCA TUYO")
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.inkSoft,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  )
}

export function LinkVolver({ href, children = '← Volver' }: { href: string; children?: React.ReactNode }) {
  return (
    <a href={href} style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}>
      {children}
    </a>
  )
}

export const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  fontSize: 15,
  borderRadius: 14,
  border: `1.5px solid ${COLORS.line}`,
  background: COLORS.card,
  color: COLORS.ink,
  outline: 'none',
}

export function BotonPrincipal({
  children,
  type = 'button',
  disabled,
  onClick,
}: {
  children: React.ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        padding: 16,
        fontSize: 15,
        fontWeight: 700,
        borderRadius: 100,
        border: 'none',
        background: COLORS.clay,
        color: COLORS.onClay,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )
}

export function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 15px',
        borderRadius: 100,
        fontSize: 12.5,
        fontWeight: 600,
        border: `1.5px solid ${activo ? COLORS.dark : COLORS.line}`,
        background: activo ? COLORS.dark : COLORS.card,
        color: activo ? COLORS.onDark : COLORS.inkSoft,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export function MensajeError({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: COLORS.red, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{children}</p>
  )
}

export function MensajeExito({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: COLORS.green, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{children}</p>
  )
}

// Barra de progreso de completitud (ej. perfil de trabajador)
export function BarraProgreso({ porcentaje }: { porcentaje: number }) {
  return (
    <div
      style={{
        background: COLORS.card,
        boxShadow: COLORS.cardShadow,
        borderRadius: 22,
        padding: 16,
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Perfil completado</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {porcentaje}%
        </span>
      </div>
      <div style={{ width: '100%', height: 8, borderRadius: 100, background: COLORS.line, overflow: 'hidden' }}>
        <div
          style={{
            width: `${porcentaje}%`,
            height: '100%',
            borderRadius: 100,
            background: COLORS.clay,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}