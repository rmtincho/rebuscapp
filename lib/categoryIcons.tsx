import type { ReactElement } from 'react'

// Devuelve un ícono SVG representativo según el nombre de la categoría.
// Usa coincidencia de palabras clave — no hace falta mapear las ~100
// categorías una por una, con esto cubrimos los grupos más comunes.

const props = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ICONOS: { claves: string[]; icono: ReactElement }[] = [
  {
    claves: ['cuidado', 'niñera', 'acompañ', 'medicación', 'terapéutico'],
    icono: (
      <svg {...props}>
        <path d="M12 21s-7-4.4-9.5-9C.6 8.2 2.3 4 6.5 4 9 4 11 5.6 12 7c1-1.4 3-3 5.5-3 4.2 0 5.9 4.2 4 8-2.5 4.6-9.5 9-9.5 9z" />
      </svg>
    ),
  },
  {
    claves: ['limpieza', 'lavado', 'planchado'],
    icono: (
      <svg {...props}>
        <path d="M4 4l16 16M4 20L20 4" />
      </svg>
    ),
  },
  {
    claves: ['electric', 'cámara', 'wifi', 'panel'],
    icono: (
      <svg {...props}>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    claves: ['gas'],
    icono: (
      <svg {...props}>
        <path d="M12 2s-6 6-6 11a6 6 0 0 0 12 0c0-2-1-3-2-4 0 2-1 3-2 2 1-3-1-5-2-9z" />
      </svg>
    ),
  },
  {
    claves: ['plomer', 'destap', 'termotanque', 'tanque'],
    icono: (
      <svg {...props}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
      </svg>
    ),
  },
  {
    claves: ['albañil', 'construc', 'refacc', 'piso', 'durlock', 'techo', 'demolic'],
    icono: (
      <svg {...props}>
        <path d="M14 6l3.5 3.5M3 21l7-1 8.5-8.5a2 2 0 0 0-3-3L7 17l-1 7z" />
      </svg>
    ),
  },
  {
    claves: ['carpinter', 'mueble', 'puerta', 'ventana', 'restaurac'],
    icono: (
      <svg {...props}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 3v18" />
      </svg>
    ),
  },
  {
    claves: ['pintura', 'empapelado', 'porcelanato'],
    icono: (
      <svg {...props}>
        <path d="M9 3h6v5H9zM7 8h10l-1 5H8zM10 13h4v8h-4z" />
      </svg>
    ),
  },
  {
    claves: ['herrer', 'reja', 'soldadura', 'metál'],
    icono: (
      <svg {...props}>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    claves: ['tornero', 'fresador', 'cnc', 'matricer', 'calderer', 'chapa', 'operador', 'operario', 'rigger', 'industrial', 'electromecán', 'chofer'],
    icono: (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      </svg>
    ),
  },
  {
    claves: ['cerraj', 'cerradura', 'llave'],
    icono: (
      <svg {...props}>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.5 12.5L20 3M17 6l3 3M14 9l3 3" />
      </svg>
    ),
  },
  {
    claves: ['jardin', 'poda', 'césped', 'riego'],
    icono: (
      <svg {...props}>
        <path d="M12 22c4-2 8-6 8-12a8 8 0 0 0-8-8 8 8 0 0 0-8 8c0 6 4 10 8 12z" />
        <path d="M12 22V10" />
      </svg>
    ),
  },
  {
    claves: ['mudanza', 'flete', 'embalaje', 'guardamueble'],
    icono: (
      <svg {...props}>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </svg>
    ),
  },
  {
    claves: ['paseador', 'pet', 'mascota', 'canin', 'veterinar'],
    icono: (
      <svg {...props}>
        <circle cx="12" cy="16" r="3" />
        <circle cx="6" cy="9" r="2" />
        <circle cx="18" cy="9" r="2" />
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
      </svg>
    ),
  },
  {
    claves: ['peluquer', 'manicura', 'maquillaje', 'masaje', 'estética'],
    icono: (
      <svg {...props}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.5 15.5M8.5 8.5L20 20" />
      </svg>
    ),
  },
  {
    claves: ['mozo', 'bartender', 'evento', 'fotograf', 'filmac', 'animac', 'dj', 'decorac', 'gastronom', 'pasteler', 'cocinero'],
    icono: (
      <svg {...props}>
        <path d="M5.8 11.3 2 22l10.7-3.8M4 3h16M4 3c0 6 4 9 4 9M20 3c0 6-4 9-4 9M9 12h6" />
      </svg>
    ),
  },
  {
    claves: ['clase', 'apoyo escolar', 'idioma', 'música', 'exam', 'manejo'],
    icono: (
      <svg {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
      </svg>
    ),
  },
  {
    claves: [
      'tecnolog', 'comput', 'celular', 'software', 'soporte técnico', 'pc',
      'programador', 'desarrollador', 'analista', 'tester', 'soporte it', 'redes y servidores',
      'ciberseguridad', 'página web', 'plc', 'community manager',
    ],
    icono: (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M2 20h20" />
      </svg>
    ),
  },
  {
    claves: ['mecánic', 'auto', 'grúa', 'goma', 'vehículo', 'lavado de auto'],
    icono: (
      <svg {...props}>
        <path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        <path d="M3 17V10l2-5h10l4 5v7" />
      </svg>
    ),
  },
  {
    claves: ['costura', 'tapicer', 'confecc'],
    icono: (
      <svg {...props}>
        <circle cx="8" cy="8" r="4" />
        <path d="M11 11l9 9M20 11l-9 9" />
      </svg>
    ),
  },
  {
    claves: ['derecho', 'legal', 'sucesion', 'laboral', 'consumidor', 'civil'],
    icono: (
      <svg {...props}>
        <path d="M12 3v18M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0zM5 8h14M8 3h8" />
      </svg>
    ),
  },
  {
    claves: ['tramit', 'traducc', 'diseño', 'contabilidad', 'gestor'],
    icono: (
      <svg {...props}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    claves: ['compra', 'mandado', 'turno', 'organizac'],
    icono: (
      <svg {...props}>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
    ),
  },
]

// Ícono genérico para lo que no matchea con nada (ej. "Otro")
const ICONO_DEFAULT = (
  <svg {...props}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
  </svg>
)

export function iconoParaCategoria(nombreCategoria: string): ReactElement {
  const texto = nombreCategoria.toLowerCase()
  for (const { claves, icono } of ICONOS) {
    if (claves.some((clave) => texto.includes(clave))) {
      return icono
    }
  }
  return ICONO_DEFAULT
}