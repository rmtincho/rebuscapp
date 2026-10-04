'use client'

import PanelFormulario from '@/components/PanelFormulario'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardarDatosPersonales } from '@/app/actions/usuarios'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina, Subtitulo, inputBaseStyle, BotonPrincipal, MensajeError } from '@/lib/ui'

export default function CompletarDatosForm({
  nombreActual,
  apellidoActual,
  edadActual,
  dniActual,
  volverA,
}: {
  nombreActual: string
  apellidoActual: string
  edadActual: number | null
  dniActual: string
  volverA: string
}) {
  const router = useRouter()

  const [nombre, setNombre] = useState(nombreActual)
  const [apellido, setApellido] = useState(apellidoActual)
  const [edad, setEdad] = useState(edadActual !== null ? String(edadActual) : '')
  const [dni, setDni] = useState(dniActual)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    if (nombreLimpio.length < 2 || apellidoLimpio.length < 2) {
      setError('Ingresá tu nombre y tu apellido.')
      return
    }

    const edadNum = Number(edad)
    if (!edad || isNaN(edadNum) || edadNum < 18 || edadNum > 99) {
      setError('Ingresá una edad válida (entre 18 y 99).')
      return
    }

    const dniLimpio = dni.trim().replace(/\D/g, '')
    if (dniLimpio.length < 7 || dniLimpio.length > 8) {
      setError('Ingresá un DNI válido, sin puntos (solo números).')
      return
    }

    setCargando(true)

    const resultado = await guardarDatosPersonales({
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      edad: edadNum,
      dni: dniLimpio,
    })

    setCargando(false)

    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    router.push(volverA)
    router.refresh()
  }

  return (
    <PantallaBase>
      <div className="sin-limite-web" style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 60px' }}>
        <LinkVolver href={volverA} />
        {/* En compu: panel amarillo fijo a la izquierda y el formulario a la derecha */}
        <div className="web-dos-columnas">
        <PanelFormulario
          titulo={'Completá tus datos'}
          texto={'Los pedimos una sola vez, para que quien publica sepa que sos una persona real.'}
          consejos={['Tu edad y tu DNI no se muestran a nadie.', 'Después podés cambiarlos desde tu perfil.']}
        />
        <div style={{ minWidth: 0 }}>
        <div className="solo-movil">
        <TituloPagina>Completá tus datos</TituloPagina>
        <Subtitulo>Necesitamos esto para que puedas postularte a trabajos. Es una sola vez.</Subtitulo>
        </div>
        <form onSubmit={guardar} style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.inkSoft, marginBottom: 8 }}>
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María"
            style={{ ...inputBaseStyle, marginBottom: 18 }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.inkSoft, marginBottom: 8 }}>
            Apellido
          </label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Ej: Fernández"
            style={{ ...inputBaseStyle, marginBottom: 18 }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.inkSoft, marginBottom: 8 }}>
            Edad
          </label>
          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Ej: 34"
            style={{ ...inputBaseStyle, marginBottom: 18 }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.inkSoft, marginBottom: 8 }}>
            DNI
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Sin puntos, solo números"
            style={{ ...inputBaseStyle, marginBottom: 6 }}
          />
          <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 20 }}>
            No lo mostramos a nadie — es solo para verificar que sos una persona real.
          </p>

          {error && <MensajeError>{error}</MensajeError>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar y continuar'}
          </BotonPrincipal>
        </form>
        </div>
        </div>
      </div>
    </PantallaBase>
  )
}