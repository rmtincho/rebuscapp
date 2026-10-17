// Turno (de día / de noche): en el trabajo es lo que pide quien publica, en
// el perfil es lo que prefiere el trabajador. Ninguno de los dos es
// obligatorio, y no filtra a quién le aparece el trabajo.

// En el trabajo. "Rotativo" solo tiene sentido en un puesto fijo.
export const TURNOS_TRABAJO = [
  { valor: 'diurno', label: 'Diurno' },
  { valor: 'nocturno', label: 'Nocturno' },
  { valor: 'rotativo', label: 'Rotativo' },
]

export const TURNO_TRABAJO_ETIQUETA: Record<string, string> = {
  diurno: 'Diurno',
  nocturno: 'Nocturno',
  rotativo: 'Turno rotativo',
}

// En el perfil del trabajador
export const TURNOS_TRABAJADOR = [
  { valor: 'diurno', label: 'De día' },
  { valor: 'nocturno', label: 'De noche' },
  { valor: 'indistinto', label: 'Día o noche' },
]

export const TURNO_TRABAJADOR_ETIQUETA: Record<string, string> = {
  diurno: 'De día',
  nocturno: 'De noche',
  indistinto: 'Día o noche',
}
