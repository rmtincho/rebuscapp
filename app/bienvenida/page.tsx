import type { Metadata } from 'next'
import Image from 'next/image'
import { COLORS } from '@/lib/theme'
import BotonInstalar from '@/components/BotonInstalar'
import { LEGAL } from '@/lib/legal'

// Landing pública: la ve quien entra sin sesión (proxy.ts manda "/" acá).
// Su trabajo es explicar la app en dos minutos y que la instalen.

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

const eyebrow: React.CSSProperties = {
  display: 'inline-block',
  background: COLORS.dark,
  color: COLORS.onDark,
  fontSize: 13,
  fontWeight: 500,
  padding: '7px 14px',
  borderRadius: 100,
  marginBottom: 14,
}

const tituloSeccion: React.CSSProperties = {
  fontSize: 'clamp(24px, 6vw, 34px)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  color: COLORS.ink,
  margin: '0 0 24px',
}

const tarjeta: React.CSSProperties = {
  background: COLORS.card,
  borderRadius: 24,
  padding: 22,
  boxShadow: COLORS.cardShadow,
}

function Paso({ numero, titulo, texto }: { numero: number; titulo: string; texto: string }) {
  return (
    <li style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: COLORS.clay,
          color: COLORS.onClay,
          fontWeight: 700,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {numero}
      </span>
      <div>
        <p style={{ fontSize: 15.5, fontWeight: 700, color: COLORS.ink, margin: '4px 0 2px' }}>{titulo}</p>
        <p style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0 }}>{texto}</p>
      </div>
    </li>
  )
}

function Ventaja({ icono, titulo, texto }: { icono: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div style={tarjeta}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: COLORS.clayTint,
          color: COLORS.clayDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icono}
        </svg>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' }}>{titulo}</p>
      <p style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0 }}>{texto}</p>
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
        borderRadius: 36,
        padding: 10,
        background: COLORS.dark,
        boxShadow: '0 30px 60px rgba(80, 60, 20, 0.28)',
        transform: 'rotate(3deg)',
      }}
    >
      <div style={{ borderRadius: 28, background: COLORS.paper, padding: '18px 14px 22px', overflow: 'hidden' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.06em', margin: '0 0 10px' }}>
          3 TRABAJOS CERCA TUYO
        </p>
        {[
          { cat: 'Plomería', titulo: 'Cambiar canilla de la cocina', precio: '$25.000', dist: '1,2 km', tag: COLORS.tagBlue, tagText: COLORS.tagBlueText },
          { cat: 'Limpieza', titulo: 'Limpieza de depto 2 ambientes', precio: 'A convenir', dist: '800 m', tag: COLORS.tagPink, tagText: COLORS.tagPinkText },
          { cat: 'Mudanzas', titulo: 'Ayuda para cargar un flete', precio: '$40.000', dist: '3 km', tag: COLORS.tagOrange, tagText: COLORS.tagOrangeText },
        ].map((t) => (
          <div key={t.titulo} style={{ background: COLORS.card, borderRadius: 16, padding: 12, marginBottom: 8, boxShadow: COLORS.cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, background: t.tag, color: t.tagText, padding: '3px 8px', borderRadius: 100 }}>
                {t.cat}
              </span>
              <span style={{ fontSize: 10.5, color: COLORS.inkSoft, fontWeight: 500 }}>{t.dist}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: '0 0 6px' }}>{t.titulo}</p>
            <span style={{ fontSize: 11.5, fontWeight: 700, background: COLORS.dark, color: COLORS.onDark, padding: '3px 9px', borderRadius: 100 }}>
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
      {/* Encabezado */}
      <header style={{ ...contenedor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 18 }}>
        <Image src="/logo_color.png" alt="Rebuscapp" width={150} height={39} priority />
        <a
          href="/login"
          style={{
            padding: '9px 18px',
            borderRadius: 100,
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

      {/* Hero */}
      <section style={{ ...contenedor, paddingTop: 12, paddingBottom: 48 }}>
        <div
          style={{
            background: COLORS.clayGradient,
            borderRadius: 32,
            padding: 'clamp(28px, 6vw, 56px) clamp(20px, 5vw, 48px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 36,
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ ...eyebrow, marginBottom: 18 }}>Comodoro Rivadavia</span>
            <h1
              style={{
                fontSize: 'clamp(32px, 8.5vw, 52px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                margin: '0 0 16px',
                color: COLORS.ink,
              }}
            >
              Trabajos y trabajadores cerca tuyo.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 4.2vw, 19px)', lineHeight: 1.5, color: 'rgba(28, 28, 30, 0.78)', margin: '0 0 26px', maxWidth: 460 }}>
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
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <span style={eyebrow}>Qué es Rebuscapp</span>
        <h2 style={{ ...tituloSeccion, maxWidth: 760 }}>Para conseguir a alguien que haga un trabajo, o conseguir trabajo.</h2>
        <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 760, margin: '-8px 0 28px' }}>
          Rebuscapp conecta a personas y comercios que necesitan que alguien haga un trabajo (arreglar una
          canilla, pintar, limpiar, hacer un flete, cubrir un puesto) con trabajadores de Comodoro Rivadavia
          que buscan trabajo. Se publica, se postulan, chatean y se arreglan directamente entre ustedes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
          {[
            {
              titulo: 'Si necesitás a alguien',
              texto: 'Para un arreglo de una tarde o para cubrir un puesto fijo. Publicás gratis y elegís entre quienes se postulan.',
            },
            {
              titulo: 'Si buscás trabajo',
              texto: 'Te avisamos cuando sale algo de tu rubro. Tu perfil y tus calificaciones te ayudan a conseguir el próximo.',
            },
            {
              titulo: 'Si tenés un comercio',
              texto: 'Podés publicar tus puestos como empresa y, si querés, anunciar tu negocio en la app.',
            },
          ].map((c) => (
            <div key={c.titulo} style={tarjeta}>
              <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: '0 0 6px' }}>{c.titulo}</p>
              <p style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0 }}>{c.texto}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5, margin: '18px 0 0', maxWidth: 760 }}>
          Rebuscapp no es una agencia ni se mete en el pago: no cobra comisión y lo que acuerdan es entre ustedes.
        </p>
      </section>

      {/* Cómo funciona */}
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <span style={eyebrow}>Cómo funciona</span>
        <h2 style={tituloSeccion}>Dos formas de usarla, una sola cuenta.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          <div style={tarjeta}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.clayDark, letterSpacing: '0.05em', margin: '0 0 16px' }}>
              SI NECESITÁS A ALGUIEN
            </p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Paso numero={1} titulo="Publicá el trabajo" texto="Contá qué necesitás, dónde y cuánto ofrecés (o dejalo a convenir)." />
              <Paso numero={2} titulo="Recibí postulaciones" texto="Les avisamos a los trabajadores de ese rubro. Vas viendo sus perfiles y calificaciones." />
              <Paso numero={3} titulo="Elegí y coordiná" texto="Chateá con quien te interese, elegilo y, al terminar, calificalo." />
            </ol>
          </div>
          <div style={tarjeta}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.clayDark, letterSpacing: '0.05em', margin: '0 0 16px' }}>
              SI BUSCÁS TRABAJO
            </p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Paso numero={1} titulo="Armá tu perfil" texto="Tus rubros, tu experiencia, horarios, carnet e idiomas." />
              <Paso numero={2} titulo="Enterate primero" texto="Te llega un aviso cuando alguien publica un trabajo de tu rubro." />
              <Paso numero={3} titulo="Postulate y sumá calificaciones" texto="Cada trabajo bien hecho suma a tu perfil para conseguir el próximo." />
            </ol>
          </div>
        </div>
      </section>

      {/* Cómo crear la cuenta: con código por mail, y después contraseña si querés */}
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <span style={eyebrow}>Crear tu cuenta</span>
        <h2 style={tituloSeccion}>Solo con tu mail. Sin formularios largos.</h2>
        <div style={tarjeta}>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 20,
            }}
          >
            <Paso numero={1} titulo="Poné tu mail" texto="Entrá a la app y escribí tu mail. Si es la primera vez, la cuenta se crea sola." />
            <Paso numero={2} titulo="Copiá el código" texto="Te mandamos un código de 6 dígitos por mail. Lo ponés y ya estás adentro." />
            <Paso
              numero={3}
              titulo="Creá tu contraseña (si querés)"
              texto="Desde tu perfil podés crear una contraseña. La próxima vez entrás con tu mail y contraseña, sin esperar el código."
            />
          </ol>
        </div>
      </section>

      {/* Ventajas */}
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <span style={eyebrow}>Por qué Rebuscapp</span>
        <h2 style={tituloSeccion}>Pensada para Comodoro.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16 }}>
          <Ventaja
            titulo="Gratis, sin comisiones"
            texto="No cobramos por publicar ni por postularte. Lo que acuerdan es entre ustedes."
            icono={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
          />
          <Ventaja
            titulo="Gente de tu ciudad"
            texto="Trabajos y trabajadores cerca tuyo, con la distancia a la vista."
            icono={<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />}
          />
          <Ventaja
            titulo="Calificaciones reales"
            texto="Solo califican las dos personas de un trabajo que se hizo. Nada de reseñas inventadas."
            icono={<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />}
          />
          <Ventaja
            titulo="Tus datos, cuidados"
            texto="Tu DNI, tu edad y tu mail no se muestran a nadie. Hablás por el chat de la app."
            icono={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
          />
          <Ventaja
            titulo="Publicidad que no molesta"
            texto="Pocos banners fijos de comercios de la ciudad. Nada de popups ni videos que tapen la pantalla."
            icono={<path d="M3 5h18v14H3zM3 9h18M7 13h6M7 16h4" />}
          />
        </div>
      </section>

      {/* Para comercios */}
      <section style={{ ...contenedor, paddingBottom: 56 }}>
        <div
          style={{
            ...tarjeta,
            padding: 'clamp(24px, 5vw, 44px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 36,
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
                <li key={t} style={{ display: 'flex', gap: 12 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: COLORS.clay,
                      color: COLORS.onClay,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
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
                  padding: '14px 24px',
                  borderRadius: 100,
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

          {/* Ejemplo de cómo se ve un banner dentro de la app */}
          <div aria-hidden style={{ background: COLORS.paper, borderRadius: 26, padding: 18 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: COLORS.cardShadow }}>
                <div style={{ height: 10, width: '60%', borderRadius: 6, background: COLORS.line, marginBottom: 8 }} />
                <div style={{ height: 8, width: '35%', borderRadius: 6, background: COLORS.iconBg }} />
              </div>
            ))}
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: COLORS.inkSoft, margin: '14px 0 6px 4px' }}>
              PATROCINADO
            </p>
            <div
              style={{
                aspectRatio: '5 / 2',
                borderRadius: 16,
                background: COLORS.clayGradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: COLORS.ink, margin: 0 }}>Tu negocio acá</p>
              <p style={{ fontSize: 13, color: 'rgba(28,28,30,0.7)', margin: 0 }}>Ferretería · Av. Rivadavia 1234</p>
            </div>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 14, marginTop: 10, boxShadow: COLORS.cardShadow }}>
              <div style={{ height: 10, width: '50%', borderRadius: 6, background: COLORS.line, marginBottom: 8 }} />
              <div style={{ height: 8, width: '30%', borderRadius: 6, background: COLORS.iconBg }} />
            </div>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section style={{ ...contenedor, paddingBottom: 48 }}>
        <div style={{ background: COLORS.dark, borderRadius: 32, padding: 'clamp(28px, 6vw, 48px) 24px', textAlign: 'center' }}>
          <Image src="/logo_blanco.png" alt="Rebuscapp" width={170} height={45} style={{ margin: '0 auto 18px', display: 'block' }} />
          <h2 style={{ ...tituloSeccion, color: COLORS.onDark, margin: '0 0 10px' }}>Instalala en tu celular.</h2>
          <p style={{ fontSize: 15.5, color: 'rgba(255, 255, 255, 0.7)', margin: '0 auto 24px', maxWidth: 420, lineHeight: 1.5 }}>
            Queda en tu pantalla de inicio como cualquier app, y te avisa cuando hay algo para vos.
          </p>
          <BotonInstalar />
        </div>
      </section>

      <footer
        style={{
          ...contenedor,
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
