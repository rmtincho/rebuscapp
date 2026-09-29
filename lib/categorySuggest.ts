// Sugerencia de categorías mientras el usuario escribe la descripción
// del pedido. Es 100% por palabras clave (sin IA, sin costo, sin
// llamadas a ningún servicio) — corre entero en el navegador.

type CategoriaT = { slug: string; nombre: string; requiere_matricula: boolean }
type Grupo = { slug: string; nombre: string; categorias: CategoriaT[] }

export type Sugerencia = {
  categoria: CategoriaT
  grupoNombre: string
  score: number
}

// Sinónimos y términos coloquiales extra, ajustados a los nombres
// reales de categorias.json. Se busca por coincidencia de una
// palabra clave dentro del NOMBRE de la categoría (no del slug).
const SINONIMOS: { siNombreIncluye: string; palabrasClave: string[] }[] = [
  { siNombreIncluye: 'adultos mayores', palabrasClave: ['abuela', 'abuelo', 'anciano', 'acompañar', 'acompañante', 'adulto mayor'] },
  { siNombreIncluye: 'niñera', palabrasClave: ['bebé', 'bebe', 'chicos', 'niños', 'ninos', 'nena', 'nene', 'hijos'] },
  { siNombreIncluye: 'cuidado con necesidades médicas', palabrasClave: ['enfermo', 'enfermedad', 'cuidados médicos', 'cuidados medicos'] },
  { siNombreIncluye: 'aplicación de medicación', palabrasClave: ['inyección', 'inyeccion', 'remedios', 'pastillas'] },
  { siNombreIncluye: 'discapacidad', palabrasClave: ['silla de ruedas', 'movilidad reducida'] },
  { siNombreIncluye: 'post-operatorio', palabrasClave: ['operación', 'operacion', 'cirugía', 'cirugia', 'recuperación', 'recuperacion'] },

  { siNombreIncluye: 'limpieza general', palabrasClave: ['limpiar', 'casa', 'departamento', 'depto'] },
  { siNombreIncluye: 'limpieza profunda', palabrasClave: ['a fondo', 'muy sucio'] },
  { siNombreIncluye: 'limpieza post-obra', palabrasClave: ['fin de obra', 'después de la obra', 'despues de la obra'] },
  { siNombreIncluye: 'lavado y planchado', palabrasClave: ['ropa', 'planchar', 'lavar ropa'] },
  { siNombreIncluye: 'vidrios en altura', palabrasClave: ['ventanas altas', 'edificio'] },
  { siNombreIncluye: 'piletas', palabrasClave: ['pileta', 'piscina'] },

  { siNombreIncluye: 'electricidad', palabrasClave: ['luz', 'enchufe', 'cable', 'cortocircuito', 'corte de luz', 'tablero', 'llave térmica', 'llave termica'] },
  { siNombreIncluye: 'gas', palabrasClave: ['calefón', 'calefon', 'estufa', 'garrafa', 'termotanque', 'olor a gas', 'cocina a gas'] },
  { siNombreIncluye: 'aires acondicionados', palabrasClave: ['split', 'climatización', 'climatizacion'] },
  { siNombreIncluye: 'service de aire', palabrasClave: ['no enfría', 'no enfria', 'aire no anda'] },
  { siNombreIncluye: 'cámaras de seguridad', palabrasClave: ['camara', 'seguridad casa'] },
  { siNombreIncluye: 'portones automáticos', palabrasClave: ['porton electrico', 'portón eléctrico'] },
  { siNombreIncluye: 'redes y wifi', palabrasClave: ['internet', 'router', 'wifi lento'] },

  { siNombreIncluye: 'plomería', palabrasClave: ['canilla', 'canillas', 'caño', 'caños', 'agua', 'pérdida', 'perdida', 'pierde agua', 'inodoro', 'baño', 'grifería', 'griferia'] },
  { siNombreIncluye: 'destapaciones', palabrasClave: ['destape', 'tapado', 'cloaca', 'inodoro tapado'] },
  { siNombreIncluye: 'termotanques', palabrasClave: ['agua caliente', 'no calienta'] },

  { siNombreIncluye: 'albañilería', palabrasClave: ['pared', 'revoque', 'obra', 'ladrillo', 'construcción', 'construccion'] },
  { siNombreIncluye: 'pisos y cerámicos', palabrasClave: ['piso roto', 'cerámico', 'ceramico', 'baldosa'] },
  { siNombreIncluye: 'durlock', palabrasClave: ['pared de durlock', 'placa de yeso'] },
  { siNombreIncluye: 'techos e impermeabilización', palabrasClave: ['gotera', 'humedad', 'chapa', 'impermeabilizar', 'techo'] },
  { siNombreIncluye: 'canaletas', palabrasClave: ['desagüe techo', 'desague techo'] },

  { siNombreIncluye: 'arreglos de muebles', palabrasClave: ['mueble roto', 'silla rota', 'mesa rota'] },
  { siNombreIncluye: 'muebles a medida', palabrasClave: ['mueble a medida', 'mandar a hacer'] },
  { siNombreIncluye: 'puertas y ventanas', palabrasClave: ['puerta', 'puertas', 'ventana', 'ventanas', 'bisagra', 'marco'] },
  { siNombreIncluye: 'restauración de muebles', palabrasClave: ['restaurar', 'mueble viejo'] },
  { siNombreIncluye: 'armado de muebles', palabrasClave: ['armar mueble', 'kit', 'ikea'] },

  { siNombreIncluye: 'pintura de interiores', palabrasClave: ['pintar', 'pared', 'pintor', 'habitación', 'habitacion'] },
  { siNombreIncluye: 'pintura de exteriores', palabrasClave: ['fachada', 'frente de casa'] },

  { siNombreIncluye: 'herrería', palabrasClave: ['reja', 'portón', 'porton', 'soldar', 'metal'] },
  { siNombreIncluye: 'soldadura', palabrasClave: ['soldar', 'soldador'] },

  { siNombreIncluye: 'apertura de puertas', palabrasClave: ['quedé afuera', 'quede afuera', 'me quedé sin llave', 'me quede sin llave'] },
  { siNombreIncluye: 'cambio de cerraduras', palabrasClave: ['cerradura rota', 'cambiar cerradura'] },
  { siNombreIncluye: 'copias de llaves', palabrasClave: ['copiar llave', 'duplicado de llave'] },
  { siNombreIncluye: 'cerrajero', palabrasClave: ['llave', 'cerradura', 'candado'] },

  { siNombreIncluye: 'jardinería', palabrasClave: ['pasto', 'plantas', 'poda', 'césped', 'cesped'] },
  { siNombreIncluye: 'poda de árboles', palabrasClave: ['árbol', 'arbol', 'rama', 'ramas'] },

  { siNombreIncluye: 'mudanzas', palabrasClave: ['mudarme', 'mudar', 'trasladar cosas'] },
  { siNombreIncluye: 'fletes', palabrasClave: ['flete', 'camioneta', 'transportar'] },
  { siNombreIncluye: 'embalaje', palabrasClave: ['embalar', 'cajas', 'empacar'] },

  { siNombreIncluye: 'paseador de perros', palabrasClave: ['pasear al perro', 'sacar a pasear'] },
  { siNombreIncluye: 'pet sitting', palabrasClave: ['cuidar mascota', 'cuidar perro', 'cuidar gato'] },
  { siNombreIncluye: 'peluquería canina', palabrasClave: ['bañar al perro', 'banar al perro', 'corte de pelo perro'] },
  { siNombreIncluye: 'veterinari', palabrasClave: ['perro enfermo', 'gato enfermo', 'vacuna', 'mascota enferma'] },

  { siNombreIncluye: 'peluquería', palabrasClave: ['pelo', 'corte', 'peinado', 'color de pelo'] },
  { siNombreIncluye: 'manicura', palabrasClave: ['uñas', 'unas'] },
  { siNombreIncluye: 'maquillaje', palabrasClave: ['maquillar', 'maquillarme'] },
  { siNombreIncluye: 'masajes', palabrasClave: ['masaje', 'relajación', 'relajacion'] },

  { siNombreIncluye: 'mozo', palabrasClave: ['camarero', 'mesero'] },
  { siNombreIncluye: 'cocinero', palabrasClave: ['cocinar para', 'chef'] },
  { siNombreIncluye: 'pastelería', palabrasClave: ['torta', 'tortas', 'postres'] },
  { siNombreIncluye: 'fotografía de eventos', palabrasClave: ['fotógrafo', 'fotografo', 'fotos evento'] },
  { siNombreIncluye: 'filmación de eventos', palabrasClave: ['filmar', 'video evento'] },
  { siNombreIncluye: 'animación infantil', palabrasClave: ['animador', 'cumpleaños infantil', 'cumpleanos infantil'] },
  { siNombreIncluye: 'payasos', palabrasClave: ['payaso', 'mago', 'magia'] },
  { siNombreIncluye: 'organización completa de eventos', palabrasClave: ['organizar fiesta', 'organizar evento'] },
  { siNombreIncluye: 'dj', palabrasClave: ['música para fiesta', 'musica para fiesta', 'sonido'] },
  { siNombreIncluye: 'decoración de eventos', palabrasClave: ['decorar', 'globos'] },
  { siNombreIncluye: 'castillos inflables', palabrasClave: ['inflable', 'juegos para chicos'] },

  { siNombreIncluye: 'apoyo escolar', palabrasClave: ['tarea', 'colegio', 'materia', 'examen', 'clases particulares'] },
  { siNombreIncluye: 'idiomas', palabrasClave: ['inglés', 'ingles', 'portugués', 'portugues'] },
  { siNombreIncluye: 'canto', palabrasClave: ['cantar', 'clases de canto'] },
  { siNombreIncluye: 'guitarra', palabrasClave: ['guitarra'] },
  { siNombreIncluye: 'piano', palabrasClave: ['piano'] },
  { siNombreIncluye: 'batería', palabrasClave: ['bateria', 'batería'] },
  { siNombreIncluye: 'computación', palabrasClave: ['computadora', 'compu', 'informática', 'informatica'] },
  { siNombreIncluye: 'clases de manejo', palabrasClave: ['aprender a manejar', 'sacar el carnet'] },
  { siNombreIncluye: 'preparación para exámenes', palabrasClave: ['rendir', 'final', 'ingreso'] },

  { siNombreIncluye: 'electrodomésticos', palabrasClave: ['heladera', 'lavarropas', 'microondas', 'no anda', 'no funciona'] },
  { siNombreIncluye: 'reparación de computadoras', palabrasClave: ['pc lenta', 'no prende', 'compu rota'] },
  { siNombreIncluye: 'reparación de celulares', palabrasClave: ['celular roto', 'pantalla rota', 'se cayó', 'se cayo'] },
  { siNombreIncluye: 'soporte técnico', palabrasClave: ['no anda internet', 'configurar', 'instalar programa'] },
  { siNombreIncluye: 'armado de pc', palabrasClave: ['armar computadora', 'ensamblar pc'] },

  { siNombreIncluye: 'mecánic', palabrasClave: ['auto', 'coche', 'motor', 'no arranca', 'taller'] },
  { siNombreIncluye: 'lavado de autos', palabrasClave: ['lavar el auto', 'lavadero'] },
  { siNombreIncluye: 'auxilio mecánico', palabrasClave: ['grúa', 'grua', 'se quedó', 'se quedo', 'quedé varado', 'quede varado'] },
  { siNombreIncluye: 'gomas', palabrasClave: ['neumático', 'neumatico', 'rueda', 'pinchazo'] },

  { siNombreIncluye: 'costura', palabrasClave: ['coser', 'costurera', 'arreglar ropa', 'dobladillo'] },
  { siNombreIncluye: 'tapicería', palabrasClave: ['tapizar', 'sillón', 'sillon'] },
  { siNombreIncluye: 'confección a medida', palabrasClave: ['hacer a medida'] },

  { siNombreIncluye: 'derecho de familia', palabrasClave: ['divorcio', 'custodia', 'cuota alimentaria'] },
  { siNombreIncluye: 'sucesiones', palabrasClave: ['herencia', 'sucesión', 'sucesion'] },
  { siNombreIncluye: 'laboral', palabrasClave: ['despido', 'juicio laboral'] },
  { siNombreIncluye: 'defensa del consumidor', palabrasClave: ['reclamo', 'estafa'] },

  { siNombreIncluye: 'trámites y gestoría', palabrasClave: ['trámite', 'tramite', 'gestoría', 'gestoria'] },
  { siNombreIncluye: 'traducciones', palabrasClave: ['traducir', 'traductor'] },
  { siNombreIncluye: 'contabilidad', palabrasClave: ['contador', 'monotributo', 'balance', 'impuestos'] },

  { siNombreIncluye: 'diseño gráfico', palabrasClave: ['logo', 'flyer', 'imagen', 'redes sociales'] },
  { siNombreIncluye: 'diseño de interiores', palabrasClave: ['decorar casa', 'ambientar'] },
  { siNombreIncluye: 'diseño web', palabrasClave: ['página web', 'pagina web', 'sitio web', 'landing'] },
  { siNombreIncluye: 'ilustración', palabrasClave: ['ilustrar', 'dibujo'] },
  { siNombreIncluye: 'identidad de marca', palabrasClave: ['logo', 'marca'] },

  { siNombreIncluye: 'compras y mandados', palabrasClave: ['mandado', 'hacer las compras', 'supermercado'] },
  { siNombreIncluye: 'turnos médicos', palabrasClave: ['médico', 'medico', 'hospital', 'consultorio'] },
  { siNombreIncluye: 'organización de espacios', palabrasClave: ['ordenar', 'organizar casa'] },

  { siNombreIncluye: 'ingeniero/a en petróleo', palabrasClave: ['petróleo', 'petroleo', 'pozo', 'reservorio', 'yacimiento', 'perforación', 'perforacion'] },
  { siNombreIncluye: 'ingeniero/a de minas', palabrasClave: ['mina', 'minería', 'mineria', 'yacimiento'] },
  { siNombreIncluye: 'técnico/a en yacimientos', palabrasClave: ['pozo', 'reservorio', 'yacimiento', 'petróleo', 'petroleo'] },
  { siNombreIncluye: 'geólogo', palabrasClave: ['geología', 'geologia', 'suelo', 'roca', 'yacimiento'] },
  { siNombreIncluye: 'perforista', palabrasClave: ['perforación', 'perforacion', 'pozo'] },
  { siNombreIncluye: 'maquinaria pesada', palabrasClave: ['máquina', 'maquina', 'excavadora', 'topadora'] },
]

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca acentos
    .trim()
}

// Considera match si son iguales, o si una es prefijo de la otra
// con al menos 4 caracteres en común — cubre variaciones simples de
// singular/plural y género ("puerta"/"puertas", "cerradura"/"cerraduras").
function palabrasRelacionadas(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 4 || b.length < 4) return false
  return a.startsWith(b) || b.startsWith(a)
}

export function sugerirCategorias(
  texto: string,
  grupos: Grupo[],
  maxResultados = 4
): Sugerencia[] {
  const textoNorm = normalizar(texto)

  // Con menos de ~4 caracteres no vale la pena sugerir todavía —
  // demasiado ruido, casi todo matchea con casi todo.
  if (textoNorm.length < 4) return []

  const palabrasTexto = textoNorm.split(/[^a-z0-9]+/).filter((p) => p.length >= 3)

  const resultados: Sugerencia[] = []

  for (const grupo of grupos) {
    for (const categoria of grupo.categorias) {
      const nombreNorm = normalizar(categoria.nombre)
      let score = 0

      // 1. Coincidencia directa: el nombre completo de la categoría
      //    (o buena parte) aparece en el texto
      if (nombreNorm.length > 3 && textoNorm.includes(nombreNorm)) {
        score += 5
      }

      // 2. Coincidencia palabra por palabra del nombre de la categoría
      //    (con tolerancia a singular/plural/género)
      const palabrasCategoria = nombreNorm.split(/[^a-z0-9]+/).filter((p) => p.length >= 3)
      for (const palabraCat of palabrasCategoria) {
        for (const palabraTexto of palabrasTexto) {
          if (palabrasRelacionadas(palabraCat, palabraTexto)) {
            score += 2
            break
          }
        }
      }

      // 3. Sinónimos / términos coloquiales
      for (const regla of SINONIMOS) {
        if (!nombreNorm.includes(normalizar(regla.siNombreIncluye))) continue
        for (const clave of regla.palabrasClave) {
          if (textoNorm.includes(normalizar(clave))) score += 3
        }
      }

      if (score > 0) {
        resultados.push({ categoria, grupoNombre: grupo.nombre, score })
      }
    }
  }

  resultados.sort((a, b) => b.score - a.score)
  return resultados.slice(0, maxResultados)
}