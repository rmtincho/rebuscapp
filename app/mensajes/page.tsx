import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina, Subtitulo } from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import ListaConversaciones from '@/components/ListaConversaciones'

// Todas las conversaciones del usuario. En el celular es solo la lista;
// en compu, la lista a la izquierda y a la derecha el lugar donde se abre
// el chat (al elegir una conversación se abre su página, que en compu
// repite esta lista al costado).

export default async function MensajesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <PantallaBase>
      <div style={{ padding: '20px 16px 120px' }}>
        <div className="solo-movil">
          <LinkVolver href="/" />
        </div>
        <TituloPagina>Mensajes</TituloPagina>
        <Subtitulo>Tus conversaciones sobre trabajos, la más reciente arriba.</Subtitulo>

        <div className="chat-grilla">
          <div className="chat-lista">
            <ListaConversaciones usuarioId={user.id} />
          </div>

          <div
            className="solo-escritorio"
            style={{
              background: COLORS.card,
              borderRadius: 24,
              boxShadow: COLORS.cardShadow,
              minHeight: 'calc(100vh - var(--alto-cabecera) - 200px)',
            }}
          >
            <div
              style={{
                height: '100%',
                minHeight: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 40,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: COLORS.clayTint,
                  color: COLORS.clayDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                </svg>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Elegí una conversación</p>
              <p style={{ fontSize: 14, color: COLORS.inkSoft, margin: 0, maxWidth: 340 }}>
                Tocá una conversación de la lista para abrir el chat acá.
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}
