import type { Metadata } from 'next'
import PaginaLegal, { Seccion, Lista } from '@/components/PaginaLegal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Términos y condiciones · Rebuscapp' }

const p = { margin: '0 0 8px' }

export default function TerminosPage() {
  return (
    <PaginaLegal titulo="Términos y condiciones">
      <Seccion titulo="1. Qué es Rebuscapp">
        <p style={p}>
          Rebuscapp es una plataforma que conecta a personas que ofrecen un trabajo con trabajadores de{' '}
          {LEGAL.ciudad}. La administra {LEGAL.responsable}. Al crear una cuenta o usar la app, aceptás
          estos términos.
        </p>
      </Seccion>

      <Seccion titulo="2. Rebuscapp solo conecta">
        <p style={p}>
          Rebuscapp no es empleador, contratista ni intermediario en el pago. El acuerdo de trabajo (qué se
          hace, cuánto se paga, cuándo y cómo) es directamente entre quien ofrece el trabajo y el trabajador.
          Rebuscapp no cobra comisión sobre ese acuerdo y no forma parte de él.
        </p>
        <p style={p}>
          Cada parte es responsable de cumplir con lo que acordó y con las normas que correspondan (por
          ejemplo, matrículas o habilitaciones para ciertos oficios, seguros e impuestos).
        </p>
      </Seccion>

      <Seccion titulo="3. Tu cuenta">
        <Lista
          items={[
            'Tenés que ser mayor de 18 años.',
            'Los datos que cargás (nombre, edad, DNI, experiencia) tienen que ser verdaderos y tuyos.',
            'La cuenta es personal: no la prestes ni uses la de otra persona.',
            'Podés eliminar tu cuenta cuando quieras desde tu perfil.',
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Qué no se puede hacer">
        <Lista
          items={[
            'Publicar trabajos ilegales, peligrosos o engañosos, o que pidan pagos por adelantado para "reservar" un puesto.',
            'Acosar, discriminar o insultar a otras personas, en el chat o en las calificaciones.',
            'Hacerte pasar por otra persona o cargar datos falsos.',
            'Usar la app para mandar publicidad, spam o para juntar datos de otros usuarios.',
            'Calificar sin que haya habido un trabajo real, o manipular las calificaciones.',
          ]}
        />
        <p style={p}>
          Podemos ocultar publicaciones y suspender o eliminar cuentas que no cumplan estas reglas.
        </p>
      </Seccion>

      <Seccion titulo="5. Seguridad">
        <p style={p}>
          Rebuscapp no verifica en persona a los usuarios ni supervisa los trabajos. Antes de encontrarte con
          alguien, revisá su perfil y sus calificaciones, preferí lugares y horarios seguros, y no compartas
          datos bancarios ni claves. Si algo te parece raro, no sigas y avisanos.
        </p>
      </Seccion>

      <Seccion titulo="6. Responsabilidad">
        <p style={p}>
          La app se ofrece tal como está. Hacemos lo posible para que funcione bien, pero puede tener
          interrupciones o errores. Rebuscapp no responde por la calidad de los trabajos, por los pagos entre
          usuarios ni por daños que surjan del acuerdo entre las partes, en la medida que lo permita la ley.
          Esto no limita los derechos que te da la Ley de Defensa del Consumidor.
        </p>
      </Seccion>

      <Seccion titulo="7. Cambios">
        <p style={p}>
          Podemos actualizar estos términos. Si el cambio es importante, te vamos a avisar en la app. Si
          seguís usándola después del aviso, se entiende que aceptás la nueva versión.
        </p>
      </Seccion>

      <Seccion titulo={LEGAL.contacto ? '8. Contacto y ley aplicable' : '8. Ley aplicable'}>
        <p style={p}>
          {LEGAL.contacto && <>Por dudas o reclamos, escribinos a {LEGAL.contacto}. </>}
          Estos términos se rigen por las leyes de la República Argentina.
        </p>
        <p style={p}>
          Cómo tratamos tus datos personales está explicado en la{' '}
          <a href="/privacidad" style={{ color: 'inherit', fontWeight: 600 }}>
            Política de privacidad
          </a>
          .
        </p>
      </Seccion>
    </PaginaLegal>
  )
}
