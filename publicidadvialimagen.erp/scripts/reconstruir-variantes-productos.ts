/**
 * Script para reconstruir variantes de productos desde sus recetas
 * 
 * Este script:
 * 1. Busca todos los productos que tienen receta pero variante vacío o []
 * 2. Reconstruye las variantes desde los recursos de la receta
 * 3. Actualiza el campo variante en la tabla productos
 * 4. Regenera las combinaciones en producto_variantes
 * 
 * Uso:
 *   npx tsx scripts/reconstruir-variantes-productos.ts
 */

import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { supabaseServer } from '../lib/supabaseServer'
import { syncProductVariants } from '../lib/variantes/variantSync'

async function reconstruirVariantesProductos() {
  console.log('🔄 Iniciando reconstrucción de variantes de productos...\n')

  try {
    // 1. Obtener todos los productos que tienen receta
    const { data: productos, error: productosError } = await supabaseServer
      .from('productos')
      .select('id, nombre, receta, variante')
      .not('receta', 'is', null)

    if (productosError) {
      throw new Error(`Error obteniendo productos: ${productosError.message}`)
    }

    if (!productos || productos.length === 0) {
      console.log('✅ No hay productos con receta para procesar')
      return
    }

    console.log(`📦 Encontrados ${productos.length} productos con receta\n`)

    let procesados = 0
    let actualizados = 0
    let errores = 0
    const productosConError: Array<{ id: string; nombre: string; error: string }> = []

    // 2. Procesar cada producto
    for (const producto of productos) {
      try {
        procesados++

        // Parsear receta
        let receta = producto.receta || []
        if (typeof receta === 'object' && !Array.isArray(receta)) {
          receta = receta.items || []
        }
        if (!Array.isArray(receta)) receta = []

        // Verificar si tiene receta válida
        if (receta.length === 0) {
          console.log(`⏭️  [${procesados}/${productos.length}] ${producto.nombre}: Sin receta válida, saltando`)
          continue
        }

        // Verificar si ya tiene variantes válidas (no vacías)
        const tieneVariantesValidas = producto.variante && 
          Array.isArray(producto.variante) && 
          producto.variante.length > 0 &&
          producto.variante.some((v: any) => 
            v && 
            v.nombre && 
            Array.isArray(v.valores) && 
            v.valores.length > 0
          )

        // Si tiene variantes válidas, saltar (a menos que se fuerce)
        if (tieneVariantesValidas) {
          console.log(`✅ [${procesados}/${productos.length}] ${producto.nombre}: Ya tiene variantes válidas, saltando`)
          continue
        }

        // Si tiene variante: [] o variantes sin valores, necesita reconstrucción
        const tieneVariantesSinValores = producto.variante && 
          Array.isArray(producto.variante) && 
          producto.variante.length > 0 &&
          producto.variante.every((v: any) => 
            !v.valores || !Array.isArray(v.valores) || v.valores.length === 0
          )

        if (tieneVariantesSinValores) {
          console.log(`🔄 [${procesados}/${productos.length}] ${producto.nombre}: Tiene variantes pero sin valores, reconstruyendo...`)
        } else {
          console.log(`🔄 [${procesados}/${productos.length}] ${producto.nombre}: Sin variantes, reconstruyendo...`)
        }

        // Verificar que la receta tenga recursos con variantes
        // Filtrar IDs inválidos (deben ser UUIDs válidos)
        const recursoIds = receta
          .map((r: any) => r.recurso_id)
          .filter(Boolean)
          .filter((id: string) => {
            // Validar que sea un UUID válido (formato básico)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return uuidRegex.test(id)
          })

        if (recursoIds.length === 0) {
          console.log(`⏭️  [${procesados}/${productos.length}] ${producto.nombre}: Receta sin recursos válidos, saltando`)
          continue
        }

        // Cargar recursos directamente (sin normalizar primero para ver el formato raw)
        const { data: recursosRaw, error: recursosError } = await supabaseServer
          .from('recursos')
          .select('*')
          .in('id', recursoIds)

        if (recursosError || !recursosRaw) {
          throw new Error(`Error cargando recursos: ${recursosError?.message}`)
        }

        // Log para debug: ver el formato raw de las variantes
        console.log(`  📋 Recursos cargados: ${recursosRaw.length}`)
        recursosRaw.forEach((r: any) => {
          console.log(`    - "${r.nombre}": variantes tipo=${typeof r.variantes}, isArray=${Array.isArray(r.variantes)}, valor=${JSON.stringify(r.variantes)?.substring(0, 100)}`)
        })

        // Importar y usar la función de normalización
        const { supabaseToRecurso } = await import('../lib/supabaseRecursos')
        const recursos = recursosRaw.map(supabaseToRecurso)

        // Normalizar y verificar que al menos un recurso tenga variantes con valores
        // Usar la misma lógica de normalización que supabaseRecursos.ts
        const recursosConVariantes = recursos.filter(r => {
          if (!r.variantes) return false
          
          let variantesArray: any[] = []
          
          // 1. Si viene como string → parsear
          if (typeof r.variantes === 'string') {
            try {
              const trimmed = r.variantes.trim()
              if (trimmed.length === 0) return false
              const parsed = JSON.parse(trimmed)
              if (Array.isArray(parsed)) {
                variantesArray = parsed
              } else if (parsed && Array.isArray(parsed.variantes)) {
                variantesArray = parsed.variantes
              }
            } catch (e) {
              return false
            }
          }
          // 2. Si viene como array directo
          else if (Array.isArray(r.variantes)) {
            variantesArray = r.variantes
          }
          // 3. Si viene como objeto con propiedad variantes
          else if (r.variantes && typeof r.variantes === 'object' && Array.isArray(r.variantes.variantes)) {
            variantesArray = r.variantes.variantes
          }
          // 4. Si viene como objeto pero no tiene estructura esperada, puede ser un array envuelto
          else if (r.variantes && typeof r.variantes === 'object') {
            // Intentar acceder directamente a las propiedades del objeto
            const keys = Object.keys(r.variantes)
            if (keys.length > 0) {
              // Puede ser un objeto con índices numéricos (array parseado como objeto)
              const firstKey = keys[0]
              if (!isNaN(Number(firstKey))) {
                // Es un array parseado como objeto, convertir a array
                variantesArray = Object.values(r.variantes)
              }
            }
          }

          // Normalizar cada variante: aceptar tanto valores como posibilidades
          const variantesNormalizadas = variantesArray
            .filter(v => v && typeof v === 'object' && v.nombre)
            .map((v: any) => {
              const valores = Array.isArray(v.valores) 
                ? v.valores.map((x: any) => String(x).trim()).filter((x: string) => x.length > 0)
                : Array.isArray(v.posibilidades)
                ? v.posibilidades.map((x: any) => String(x).trim()).filter((x: string) => x.length > 0)
                : []
              
              return {
                nombre: String(v.nombre).trim(),
                valores,
                posibilidades: valores
              }
            })
            .filter(v => v.nombre && v.valores.length > 0)

          // Verificar que tenga al menos una variante con valores
          const tieneValores = variantesNormalizadas.length > 0

          if (tieneValores) {
            console.log(`  ✓ Recurso "${r.nombre}" tiene ${variantesNormalizadas.length} variante(s) con valores:`)
            variantesNormalizadas.forEach((v: any) => {
              console.log(`    - ${v.nombre}: [${v.valores.join(', ')}]`)
            })
          }

          return tieneValores
        })

        if (recursosConVariantes.length === 0) {
          console.log(`⏭️  [${procesados}/${productos.length}] ${producto.nombre}: Recursos sin variantes con valores`)
          if (recursos.length > 0) {
            recursos.forEach(r => {
              console.log(`    - Recurso "${r.nombre}": variantes=${!!r.variantes}, tipo=${typeof r.variantes}`)
            })
          }
          continue
        }

        console.log(`🔄 [${procesados}/${productos.length}] ${producto.nombre}: Reconstruyendo variantes...`)

        // Sincronizar variantes usando la función existente
        await syncProductVariants(producto.id)

        actualizados++
        console.log(`✅ [${procesados}/${productos.length}] ${producto.nombre}: Variantes reconstruidas correctamente\n`)

      } catch (error: any) {
        errores++
        const errorMsg = error?.message || 'Error desconocido'
        productosConError.push({
          id: producto.id,
          nombre: producto.nombre || 'Sin nombre',
          error: errorMsg
        })
        console.error(`❌ [${procesados}/${productos.length}] ${producto.nombre}: Error - ${errorMsg}\n`)
      }
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE RECONSTRUCCIÓN')
    console.log('='.repeat(60))
    console.log(`Total productos procesados: ${procesados}`)
    console.log(`Productos actualizados: ${actualizados}`)
    console.log(`Errores: ${errores}`)
    console.log('='.repeat(60))

    if (productosConError.length > 0) {
      console.log('\n❌ PRODUCTOS CON ERRORES:')
      productosConError.forEach(p => {
        console.log(`  - ${p.nombre} (${p.id}): ${p.error}`)
      })
    }

    console.log('\n✅ Reconstrucción completada')

  } catch (error) {
    console.error('❌ Error fatal en reconstrucción:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  reconstruirVariantesProductos()
    .then(() => {
      console.log('\n✅ Script finalizado correctamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script finalizado con errores:', error)
      process.exit(1)
    })
}

export { reconstruirVariantesProductos }

