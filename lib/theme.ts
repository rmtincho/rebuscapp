export const COLORS = {
  // Amarillo — único color de marca, para el CTA principal y detalles puntuales.
  // El amarillo no se lee con texto blanco: encima va siempre onClay (casi negro),
  // y para texto de marca sobre fondo claro se usa clayDark.
  clay: '#FFC21A',
  clayDark: '#8A6100',
  clayTint: '#FFF1C2',
  // Degradé de la tarjeta del perfil: más claro arriba, más intenso abajo
  clayGradient: 'linear-gradient(165deg, #FFE07A 0%, #FFC21A 55%, #FFAE00 100%)',
  onClay: '#1C1C1E',

  // Verde — exclusivo para "Aceptada" / éxito
  green: '#16A34A',
  greenDark: '#15803D',
  greenTint: '#DCFCE7',

  // Rojo — exclusivo para "Rechazada"
  red: '#DC2626',
  redDark: '#B91C1C',
  redTint: '#FEE2E2',

  // Azul — mensajes / chat / videollamada
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueTint: '#DBEAFE',

  // Rosa — identidad / verificación
  sage: '#E11D48',
  sageDark: '#BE123C',
  sageTint: '#FFE4E9',

  ink: '#1C1C1E',        // texto principal — casi negro (no negro puro, más suave a la vista)
  inkSoft: '#6B7280',    // texto secundario
  paper: '#FAF7F2',      // fondo general — blanco cálido, no blanco puro (menos brillo/cansancio visual)
  card: '#FFFFFF',       // tarjetas — blanco puro, para que se distingan del fondo
  line: '#ECE5D8',       // bordes sutiles
  iconBg: '#F3EFE8',     // fondo neutro de íconos de categoría
  iconFg: '#6B7280',     // color neutro del glifo del ícono
  highlight: '#FFF6D9',  // fondo de secciones destacadas (Mis pedidos, Mis postulaciones)
  wrapperBg: '#F3E9D6',  // fondo detrás del contenedor centrado
  navBg: '#1C1C1E',      // fondo del nav flotante — cápsulas negras
  navActiveBg: '#F3EFE8', // fondo suave para opciones seleccionadas en formularios

  // Negro de las cápsulas (chips activos, precio, nav) y su texto
  dark: '#1C1C1E',
  onDark: '#FFFFFF',

  // Sombra única de tarjetas: difusa y cálida, en vez de bordes
  cardShadow: '0 6px 20px rgba(80, 60, 20, 0.07)',

  // Etiquetas pastel (categoría, distancia, etc.) — fondo + texto
  tagPink: '#FDE7EC',
  tagPinkText: '#C0305A',
  tagOrange: '#FFEBD6',
  tagOrangeText: '#B45A12',
  tagBlue: '#E3EEFD',
  tagBlueText: '#2F6BC9',
} as const