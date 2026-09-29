import React from 'react'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina, Subtitulo } from '@/lib/ui'
import { LEGAL } from '@/lib/legal'

// Esqueleto de Términos y Privacidad: se ven sin estar logueado
// (el enlace aparece en el login), así que no llevan barra de abajo.
export default function PaginaLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 48px', color: COLORS.ink, fontSize: 14, lineHeight: 1.6 }}>
        <LinkVolver href="/" />
        <TituloPagina>{titulo}</TituloPagina>
        <Subtitulo>Última actualización: {LEGAL.actualizado}</Subtitulo>
        {children}
      </div>
    </PantallaBase>
  )
}

export function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{titulo}</h2>
      {children}
    </section>
  )
}

export function Lista({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ paddingLeft: 20, margin: '6px 0', listStyle: 'disc' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}
