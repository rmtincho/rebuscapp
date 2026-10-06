import type { Metadata } from 'next'
import Image from 'next/image'
import { COLORS } from '@/lib/theme'
import BotonInstalar from '@/components/BotonInstalar'
import { LEGAL } from '@/lib/legal'

// Landing pública: la ve quien entra sin sesión (proxy.ts manda "/" acá).
// Su trabajo es explicar la app en dos minutos y que la instalen.
// Estilo sobrio: franjas de lado a lado, rayas en vez de tarjetas con
// sombra y poco redondeo, como el resto de la app.

export const metadata: Metadata = {
  title: 'Rebuscapp · Trabajos y trabajadores en Comodoro Rivadavia',
  description:
    'Publicá un trabajo o encontrá uno cerca tuyo en Comodoro Rivadavia. Gratis y sin comisiones. Instalá la app en tu celular.',
  openGraph: {
    title: 'Rebuscapp',
    description: 'Trabajos y trabajadores cerca tuyo en Comodoro Rivadavia. Gratis y sin comisiones.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Rebuscapp' }],
    locale: 'es_AR',
    type: 'website',
  },
}

const contenedor: React.CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '0 20px' }

// Etiqueta de sección: texto chico en mayúsculas, sin caja
const eyebrow: React.CSSProperties = {
  display: 'block',
  color: COLORS.clayDark,
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 10,
}

const tituloSeccion: React.CSSProperties = {
  fontSize: 'clamp(24px, 6vw, 34px)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  color: COLORS.ink,
  margin: '0 0 24px',
}

// Bloques con una raya arriba en vez de tarjetas con sombra
const columna: React.CSSProperties = {
  borderTop: `2px solid ${COLORS.ink}`,
  paddingTop: 14,
}

const textoSuave: React.CSSProperties = { fontSize: 15.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: 0 }

const tituloColumna: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: '0 0 6px' }

function Paso({ numero, titulo, texto }: { numero: number; titulo: string; texto: string }) {
  return (
    <li style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
      <span style={{ flexShrink: 0, width: 22, fontSize: 15.5, fontWeight: 700, color: COLORS.clayDark }}>{numero}.</span>
      <div>
        <p style={{ fontSize: 15.5, fontWeight: 700, color: COLORS.ink, margin: '0 0 2px' }}>{titulo}</p>
        <p style={textoSuave}>{texto}</p>
      </div>
    </li>
  )
}

function Ventaja({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div style={columna}>
      <p style={tituloColumna}>{titulo}</p>
      <p style={textoSuave}>{texto}</p>
    </div>
  )
}

// Celular dibujado con una tarjeta de trabajo de ejemplo
function CelularEjemplo() {
  return (
    <div
      aria-hidden
      style={{
        width: 'min(280px, 78vw)',
        margin: '0 auto',
        borderRadius: 30,
        padding: 9,
        background: COLORS.dark,
      }}
    >
      <div style={{ borderRadius: 22, background: COLORS.paper, padding: '18px 14px 22px', overflow: 'hidden' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.06em', margin: '0 0 10px' }}>
          3 TRABAJOS CERCA TUYO
        </p>
        {[
          { cat: 'Plomería', titulo: 'Cambiar canilla de la cocina', precio: '$25.000', dist: '1,2 km', tag: COLORS.tagBlue, tagText: COLORS.tagBlueText },
          { cat: 'Limpieza', titulo: 'Limpieza de depto 2 ambientes', precio: 'A convenir', dist: '800 m', tag: COLORS.tagPink, tagText: COLORS.tagPinkText },
          { cat: 'Mudanzas', titulo: 'Ayuda para cargar un flete', precio: '$40.000', dist: '3 km', tag: COLORS.tagOrange, tagText: COLORS.tagOrangeText },
        ].map((t) => (
          <div key={t.titulo} style={{ background: COLORS.card, borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, background: t.tag, color: t.tagText, padding: '3px 7px', borderRadius: 4 }}>
                {t.cat}
              </span>
              <span style={{ fontSize: 10.5, color: COLORS.inkSoft, fontWeight: 500 }}>{t.dist}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: '0 0 6px' }}>{t.titulo}</p>
            <span style={{ fontSize: 11, fontWeight: 400, background: COLORS.blueTint, color: COLORS.blueDark, padding: '3px 7px', borderRadius: 4 }}>
              {t.precio}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BienvenidaPage() {
  return (
    <div style={{ background: COLORS.paper, minHeight: '100vh', color: COLORS.ink, overflowX: 'hidden' }}>
      {/* Hero amarillo de lado a lado, con el encabezado adentro */}
      <section style={{ background: COLORS.clayGradient }}>
        <header style={{ ...contenedor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 18 }}>
          <Image src="/logo_negro.png" alt="Rebuscapp" width={150} height={39} priority />
          <a
            href="/login"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1.5px solid ${COLORS.ink}`,
              color: COLORS.ink,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Entrar
          </a>
        </header>
        <div
          style={{
            ...contenedor,
            paddingTop: 'clamp(20px, 5vw, 48px)',
            paddingBottom: 'clamp(36px, 7vw, 64px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ ...eyebrow, color: COLORS.ink, marginBottom: 14 }}>Comodoro Rivadavia</span>
            <h1
              style={{
                fontSize: 'clamp(32px, 8.5vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                margin: '0 0 16px',
                color: COLORS.ink,
              }}
            >
              Trabajos y trabajadores cerca tuyo.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 4.2vw, 19px)', lineHeight: 1.5, color: COLORS.ink, margin: '0 0 26px', maxWidth: 460 }}>
              Publicá lo que necesitás y recibí postulaciones de gente de tu ciudad. O encontrá trabajo en tu rubro,
              con avisos al instante. Gratis y sin comisiones.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <BotonInstalar variante="oscuro" />
              <a href="/login" style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.ink, padding: '10px 6px' }}>
                o usala desde el navegador
              </a>
            </div>
          </div>
          <CelularEjemplo />
        </div>
      </section>

      {/* Qué es */}
      <section style={{ ...contenedor, paddingTop: 56, paddingBottom: 56 }}>
        <span style={eyebrow}>Qué es Rebuscapp</span>
        <h2 style={{ ...tituloSeccion, maxWidth: 760 }}>Para conseguir a alguien que haga un trabajo, o conseguir trabajo.</h2>
        <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 760, margin: '-8px 0 32px' }}>
          Rebuscapp conecta a personas y comercios que necesitan que alguien haga un trabajo (arreglar una
          canilla, pintar, limpiar, hacer un flete, cubrir un puesto) con trabajadores de Comodoro Rivadavia
          que buscan trabajo. Se publica, se postulan, chatean y se arreglan directamente entre ustedes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 28 }}>
          <Ventaja
            titulo="Si necesitás a alguien"
            texto="Para un arreglo de una tarde o para cubrir un puesto fijo. Publicás gratis y elegís entre quienes se postulan."
          />
          <Ventaja
            titulo="Si buscás trabajo"
            texto="Te avisamos cuando sale algo de tu rubro. Tu perfil y tus calificaciones te ayudan a conseguir el próximo."
          />
          <Ventaja
            titulo="Si tenés un comercio"
            texto="Podés publicar tus puestos como empresa y, si querés, anunciar tu negocio en la app."
          />
        </div>
        <p style={{ ...textoSuave, fontSize: 14, margin: '24px 0 0', maxWidth: 760 }}>
          Rebuscapp no es una agencia ni se mete en el pago: no cobra comisión y lo que acuerdan es entre ustedes.
        </p>
      </section>

      {/* Cómo funciona: franja blanca */}
      <section style={{ background: COLORS.card }}>
        <div style={{ ...contenedor, paddingTop: 56, paddingBottom: 56 }}>
          <span style={eyebrow}>Cómo funciona</span>
          <h2 style={tituloSeccion}>Dos formas de usarla, una sola cuenta.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 40 }}>
            <div style={columna}>
              <p style={{ ...tituloColumna, margin: '0 0 18px' }}>Si necesitás a alguien</p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Paso numero={1} titulo="Publicá el trabajo" texto="Contá qué necesitás, dónde y cuánto ofrecés (o dejalo a convenir)." />
                <Paso numero={2} titulo="Recibí postulaciones" texto="Les avisamos a los trabajadores de ese rubro. Vas viendo sus perfiles y calificaciones." />
                <Paso numero={3} titulo="Elegí y coordiná" texto="Chateá con quien te interese, elegilo y, al terminar, calificalo." />
              </ol>
            </div>
            <div style={columna}>
              <p style={{ ...tituloColumna, margin: '0 0 18px' }}>Si buscás trabajo</p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Paso numero={1} titulo="Armá tu perfil" texto="Tus rubros, tu experiencia, horarios, carnet e idiomas." />
                <Paso numero={2} titulo="Enterate primero" texto="Te llega un aviso cuando alguien publica un trabajo de tu rubro." />
                <Paso numero={3} titulo="Postulate y sumá calificaciones" texto="Cada trabajo bien hecho suma a tu perfil para conseguir el próximo." />
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo entrar: la primera vez con un código por mail; después, con la contraseña que se crea */}
      <section style={{ ...contenedor, paddingTop: 56, paddingBottom: 56 }}>
        <span style={eyebrow}>Crear tu cuenta</span>
        <h2 style={{ ...tituloSeccion, margin: '0 0 10px' }}>La primera vez entrás con un código por mail.</h2>
        <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 760, margin: '0 0 28px' }}>
          No hay formulario de registro: con tu mail alcanza. Después creás tu contraseña y ya entrás directo.
        </p>
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 28,
          }}
        >
          <Paso numero={1} titulo="Poné tu mail" texto="Tocá Entrar y escribí tu mail. Si es la primera vez, la cuenta se crea sola." />
          <Paso numero={2} titulo="Copiá el código" texto="Te llega un código de 6 dígitos a tu mail (mirá también en spam). Lo ponés y ya estás adentro." />
          <Paso
            numero={3}
            titulo="Creá tu contraseña"
            texto="Ya adentro, en tu perfil, tocá Creá tu contraseña. Las próximas veces entrás con tu mail y tu contraseña, sin esperar el código."
          />
        </ol>
      </section>

      {/* Ventajas */}
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <span style={eyebrow}>Por qué Rebuscapp</span>
        <h2 style={tituloSeccion}>Pensada para Comodoro.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 24 }}>
          <Ventaja titulo="Gratis, sin comisiones" texto="No cobramos por publicar ni por postularte. Lo que acuerdan es entre ustedes." />
          <Ventaja titulo="Gente de tu ciudad" texto="Trabajos y trabajadores cerca tuyo, con la distancia a la vista." />
          <Ventaja titulo="Calificaciones reales" texto="Solo califican las dos personas de un trabajo que se hizo. Nada de reseñas inventadas." />
          <Ventaja titulo="Tus datos, cuidados" texto="Tu DNI, tu edad y tu mail no se muestran a nadie. Hablás por el chat de la app." />
          <Ventaja titulo="Publicidad que no molesta" texto="Pocos banners fijos de comercios de la ciudad. Nada de popups ni videos que tapen la pantalla." />
        </div>
      </section>

      {/* Para comercios: franja blanca */}
      <section style={{ background: COLORS.card }}>
        <div
          style={{
            ...contenedor,
            paddingTop: 56,
            paddingBottom: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <span style={eyebrow}>Para comercios</span>
            <h2 style={tituloSeccion}>Anunciá tu negocio donde la gente busca trabajo y trabajadores.</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Espacios fijos', 'Tu banner aparece en el inicio, en la lista de trabajos y en el detalle de cada pedido.'],
                ['Según el rubro', 'Tu ferretería puede aparecer justo cuando alguien busca plomería o electricidad.'],
                ['Resultados a la vista', 'Sabés cuántas veces se vio tu anuncio y cuántas personas lo tocaron.'],
                ['Sin molestar a nadie', 'Nada de popups ni ventanas que tapen: la gente ve tu anuncio sin que le corte lo que está haciendo.'],
              ].map(([t, d]) => (
                <li key={t} style={{ display: 'flex', gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.clayDark} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: COLORS.inkSoft }}>
                    <b style={{ color: COLORS.ink }}>{t}.</b> {d}
                  </p>
                </li>
              ))}
            </ul>
            {LEGAL.contacto && (
              <a
                href={`mailto:${LEGAL.contacto}?subject=Quiero anunciar en Rebuscapp`}
                style={{
                  display: 'inline-block',
                  marginTop: 24,
                  padding: '13px 22px',
                  borderRadius: 6,
                  background: COLORS.dark,
                  color: COLORS.onDark,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Quiero anunciar
              </a>
            )}
          </div>

          {/* Ejemplo de cómo se ve un banner dentro de la app (sin etiqueta, como en la app) */}
          <div aria-hidden style={{ background: COLORS.paper, borderRadius: 8, padding: 16 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ height: 10, width: '60%', borderRadius: 3, background: COLORS.line, marginBottom: 8 }} />
                <div style={{ height: 8, width: '35%', borderRadius: 3, background: COLORS.iconBg }} />
              </div>
            ))}
            <div
              style={{
                aspectRatio: '5 / 2',
                borderRadius: 6,
                background: COLORS.clayGradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.ink, margin: 0 }}>Tu negocio acá</p>
              <p style={{ fontSize: 13, color: COLORS.ink, margin: 0 }}>Ferretería · Av. Rivadavia 1234</p>
            </div>
            <div style={{ background: COLORS.card, borderRadius: 6, padding: 14, marginTop: 10 }}>
              <div style={{ height: 10, width: '50%', borderRadius: 3, background: COLORS.line, marginBottom: 8 }} />
              <div style={{ height: 8, width: '30%', borderRadius: 3, background: COLORS.iconBg }} />
            </div>
          </div>
        </div>
      </section>

      {/* Cierre: franja oscura de lado a lado */}
      <section style={{ background: COLORS.dark }}>
        <div style={{ ...contenedor, paddingTop: 'clamp(36px, 7vw, 56px)', paddingBottom: 'clamp(36px, 7vw, 56px)', textAlign: 'center' }}>
          <Image src="/logo_blanco.png" alt="Rebuscapp" width={170} height={45} style={{ margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ ...tituloSeccion, color: COLORS.onDark, margin: '0 0 10px' }}>Instalala en tu celular.</h2>
          <p style={{ fontSize: 15.5, color: COLORS.onDark, margin: '0 auto 24px', maxWidth: 420, lineHeight: 1.5 }}>
            Queda en tu pantalla de inicio como cualquier app, y te avisa cuando hay algo para vos.
          </p>
          <BotonInstalar />
        </div>
      </section>

      <footer
        style={{
          ...contenedor,
          paddingTop: 24,
          paddingBottom: 36,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 18px',
          justifyContent: 'center',
          fontSize: 13,
          color: COLORS.inkSoft,
        }}
      >
        <span>© {new Date().getFullYear()} Rebuscapp</span>
        <a href="/terminos" style={{ color: 'inherit' }}>
          Términos y condiciones
        </a>
        <a href="/privacidad" style={{ color: 'inherit' }}>
          Política de privacidad
        </a>
      </footer>
    </div>
  )
}
