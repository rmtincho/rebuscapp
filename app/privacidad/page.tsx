import type { Metadata } from 'next'
import PaginaLegal, { Seccion, Lista } from '@/components/PaginaLegal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Política de privacidad · Rebuscapp' }

const p = { margin: '0 0 8px' }

export default function PrivacidadPage() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <Seccion titulo="Quién es responsable">
        <p style={p}>
          El responsable de los datos que cargás en Rebuscapp es {LEGAL.responsable} ({LEGAL.ciudad}).
          {LEGAL.contacto && <> Contacto: {LEGAL.contacto}.</>}
        </p>
      </Seccion>

      <Seccion titulo="Qué datos guardamos">
        <Lista
          items={[
            <><b>Para entrar:</b> tu mail, que usamos para mandarte el código de ingreso.</>,
            <><b>Tu perfil:</b> nombre, apellido, foto, edad y DNI. Si trabajás: experiencia, estudios, disponibilidad, carnets, idiomas y los rubros que te interesan.</>,
            <><b>Tu actividad:</b> los trabajos que publicás (con su ubicación), tus postulaciones, los mensajes del chat y las calificaciones.</>,
            <><b>Tu ubicación:</b> solo si la compartís, para mostrarte trabajos cercanos.</>,
            <><b>Notificaciones:</b> si las activás, un identificador de tu navegador para poder mandártelas.</>,
          ]}
        />
      </Seccion>

      <Seccion titulo="Para qué los usamos">
        <p style={p}>
          Solo para que la app funcione: mostrar trabajos y trabajadores, conectar a las partes, mandarte
          avisos y cuidar la seguridad de la comunidad (por ejemplo, frenar cuentas falsas). No vendemos tus
          datos ni los usamos para publicidad.
        </p>
        <p style={p}>
          La app muestra banners de comercios en algunos espacios fijos. Los anunciantes no reciben ningún dato
          tuyo: solo sabemos cuántas veces se vio y se tocó cada banner, en total.
        </p>
      </Seccion>

      <Seccion titulo="Quién ve qué">
        <Lista
          items={[
            'Los demás usuarios ven tu nombre, apellido, foto, tu perfil de trabajador y tus calificaciones.',
            'Tu edad, DNI y mail no se muestran a nadie.',
            'Los mensajes del chat los ven solo las dos personas de la conversación, salvo que haya una denuncia: en ese caso podemos revisar la conversación para resolverla.',
            'Solo aparecés en el listado de trabajadores si lo activás en tu perfil.',
          ]}
        />
      </Seccion>

      <Seccion titulo="Dónde se guardan">
        <p style={p}>
          Usamos servicios externos para funcionar: Supabase (base de datos y archivos), Resend (envío
          de los mails de ingreso) y Vercel (donde corre la app). Sus servidores pueden estar fuera de
          Argentina. Tus datos se guardan ahí con acceso restringido.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p style={p}>
          Podés ver y corregir tus datos desde tu perfil.
          {LEGAL.contacto && (
            <>
              {' '}También podés pedirnos acceso, corrección o eliminación escribiendo a {LEGAL.contacto}.
              Respondemos dentro de los plazos de la Ley 25.326 de Protección de Datos Personales.
            </>
          )}
        </p>
        <p style={p}>
          También podés <b>eliminar tu cuenta</b> desde tu perfil. Al hacerlo borramos tus datos personales,
          tu foto, tu perfil de trabajador, tus postulaciones pendientes y tus notificaciones, y damos de baja
          tus trabajos abiertos. Lo que forma parte de la actividad de otras personas (mensajes que mandaste,
          calificaciones y trabajos ya asignados) queda a nombre de &quot;Usuario eliminado&quot;, sin datos
          que te identifiquen.
        </p>
        <p style={p}>
          La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las
          denuncias y reclamos de quienes consideren que no se respetaron sus derechos.
        </p>
      </Seccion>

      <Seccion titulo="Cambios">
        <p style={p}>
          Si cambiamos esta política de forma importante, te vamos a avisar en la app.
        </p>
      </Seccion>
    </PaginaLegal>
  )
}
