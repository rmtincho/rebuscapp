import { redirect } from 'next/navigation'

// Ruta vieja: el perfil ahora es de todos y vive en /perfil. Se deja
// para no romper links guardados o notificaciones viejas.
export default function PerfilPrestadorViejo() {
  redirect('/perfil#trabajador')
}
