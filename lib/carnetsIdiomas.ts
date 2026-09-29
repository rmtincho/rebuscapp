// Clases de carnet de conducir según la normativa nacional
// (licencianacional). Se usa tanto al publicar un pedido (elegir cuál
// se requiere) como en el perfil del prestador (declarar cuáles tiene).
export const CLASES_CARNET: { grupo: string; opciones: { valor: string; label: string }[] }[] = [
  {
    grupo: 'Categorías particulares',
    opciones: [
      { valor: 'A.1.1', label: 'A.1.1 — Ciclomotores hasta 50cc' },
      { valor: 'A.1.2', label: 'A.1.2 — Motos hasta 150cc' },
      { valor: 'A.1.3', label: 'A.1.3 — Motos de 150cc a 300cc' },
      { valor: 'A.1.4', label: 'A.1.4 — Motos de más de 300cc' },
      { valor: 'B.1', label: 'B.1 — Autos, utilitarios y camionetas hasta 3.500kg' },
      { valor: 'B.2', label: 'B.2 — Auto/camioneta con acoplado o casa rodante' },
      { valor: 'G', label: 'G — Maquinaria agrícola' },
    ],
  },
  {
    grupo: 'Categorías profesionales',
    opciones: [
      { valor: 'C', label: 'C — Camiones sin acoplado' },
      { valor: 'D.1', label: 'D.1 — Taxi/remise hasta 8 pasajeros' },
      { valor: 'D.2', label: 'D.2 — Colectivos y ómnibus' },
      { valor: 'D.3', label: 'D.3 — Emergencias y seguridad' },
      { valor: 'E.1', label: 'E.1 — Camiones articulados/con acoplado' },
      { valor: 'E.2', label: 'E.2 — Maquinaria especial no agrícola' },
      { valor: 'F', label: 'F — Vehículo adaptado (discapacidad)' },
    ],
  },
]

export const CLASES_CARNET_FLAT = CLASES_CARNET.flatMap((g) => g.opciones)

export const IDIOMAS_COMUNES = ['Inglés', 'Portugués', 'Italiano', 'Francés']