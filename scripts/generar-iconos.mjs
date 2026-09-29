// Genera los íconos y logos de la app a partir de los originales de
// public/nuevo-logo/. Si cambia el logo, reemplazar esos archivos y correr:
//   node scripts/generar-iconos.mjs
//
// Qué genera:
//   public/icons/icon-192.png, icon-512.png         → ícono de la app (degradé amarillo + lupa negra)
//   public/icons/icon-maskable-192.png, -512.png    → lo mismo con más margen (Android lo recorta en círculo)
//   public/icons/apple-touch-icon.png               → iPhone (180 px)
//   public/icons/badge-72.png                       → ícono chico de las notificaciones (silueta blanca)
//   public/logo-color.png, logo-negro.png, logo-blanco.png → logos recortados, sin aire alrededor
//   public/icono-negro.png                          → lupa negra para la pantalla de carga
//   public/og.png                                   → imagen al compartir el link (WhatsApp, redes)
//   public/favicon.png                              → favicon (lupa amarilla)

import sharp from 'sharp'

const ORIGEN = 'public/nuevo-logo/'

// Mismo degradé que COLORS.clayGradient en lib/theme.ts
function fondoDegrade(ancho, alto) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
    <defs>
      <linearGradient id="g" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#FFE07A"/>
        <stop offset="0.55" stop-color="#FFC21A"/>
        <stop offset="1" stop-color="#FFAE00"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`)
}

// El original recortado al contenido (sin el aire transparente de alrededor)
function recortado(archivo) {
  return sharp(ORIGEN + archivo).trim().toBuffer()
}

// Imagen centrada dentro de un cuadrado de `lado`, ocupando `proporcion` del alto
async function centrado(imagen, lado, proporcion) {
  const alto = Math.round(lado * proporcion)
  return sharp(imagen).resize({ height: alto, width: alto, fit: 'inside' }).toBuffer()
}

async function iconoApp(destino, lado, proporcion) {
  const lupa = await centrado(await recortado('rebuscapp_icono_negro.png'), lado, proporcion)
  await sharp(fondoDegrade(lado, lado))
    .composite([{ input: lupa, gravity: 'center' }])
    .png()
    .toFile(destino)
}

async function main() {
  // Íconos de la app. "any" con la lupa grande; "maskable" con la lupa dentro
  // de la zona segura (círculo del 80% central) para que Android no la corte.
  await iconoApp('public/icons/icon-192.png', 192, 0.66)
  await iconoApp('public/icons/icon-512.png', 512, 0.66)
  await iconoApp('public/icons/icon-maskable-192.png', 192, 0.52)
  await iconoApp('public/icons/icon-maskable-512.png', 512, 0.52)
  await iconoApp('public/icons/apple-touch-icon.png', 180, 0.62)

  // Badge de notificaciones: Android usa solo la silueta (canal alfa)
  const badge = await centrado(await recortado('rebuscapp_icono_blanco.png'), 72, 0.86)
  await sharp({ create: { width: 72, height: 72, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: badge, gravity: 'center' }])
    .png()
    .toFile('public/icons/badge-72.png')

  // Logos recortados
  for (const variante of ['color', 'negro', 'blanco']) {
    await sharp(await recortado(`rebuscapp_logo_${variante}.png`)).png().toFile(`public/logo-${variante}.png`)
  }

  // Lupa negra para la pantalla de carga
  await sharp(await recortado('rebuscapp_icono_negro.png')).resize({ height: 400 }).png().toFile('public/icono-negro.png')

  // Imagen para compartir el link: degradé con el logo negro
  const logoOg = await sharp(await recortado('rebuscapp_logo_negro.png')).resize({ width: 760 }).toBuffer()
  await sharp(fondoDegrade(1200, 630)).composite([{ input: logoOg, gravity: 'center' }]).png().toFile('public/og.png')

  // Favicon: lupa amarilla sobre transparente, cuadrada
  const lupaColor = await centrado(await recortado('rebuscapp_icono_color.png'), 96, 0.94)
  await sharp({ create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: lupaColor, gravity: 'center' }])
    .png()
    .toFile('public/favicon.png')

  console.log('Listo: íconos y logos generados.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
