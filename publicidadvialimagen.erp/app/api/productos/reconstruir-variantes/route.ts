import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { syncProductVariants } from '@/lib/variantes/variantSync'

/**
 * POST - Reconstruir variantes de productos que tienen receta pero variante vacío
 * 
 * Este endpoint reconstruye las variantes de productos basándose en sus recetas.
 * Útil para migrar productos antiguos que no tienen variantes guardadas.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { producto_id, todos } = body

    // Si se especifica un producto_id, solo procesar ese
    if (producto_id) {
      console.log(`🔄 Reconstruyendo variantes para producto: ${producto_id}`)
      await syncProductVariants(producto_id)
      
      return NextResponse.json({
        success: true,
        message: 'Variantes reconstruidas correctamente'
      })
    }

    // Si se solicita procesar todos, hacerlo
    if (todos) {
      console.log('🔄 Reconstruyendo variantes para todos los productos...')

      // Obtener todos los productos que tienen receta
      const { data: productos, error: productosError } = await supabaseServer
        .from('productos')
        .select('id, nombre, receta, variante')
        .not('receta', 'is', null)

      if (productosError) {
        throw new Error(`Error obteniendo productos: ${productosError.message}`)
      }

      if (!productos || productos.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay productos con receta para procesar',
          procesados: 0,
          actualizados: 0
        })
      }

      let procesados = 0
      let actualizados = 0
      const errores: Array<{ id: string; nombre: string; error: string }> = []

      for (const producto of productos) {
        try {
          procesados++

          // Parsear receta
          let receta = producto.receta || []
          if (typeof receta === 'object' && !Array.isArray(receta)) {
            receta = receta.items || []
          }
          if (!Array.isArray(receta) || receta.length === 0) continue

          // Verificar si ya tiene variantes
          const tieneVariantes = producto.variante && 
            Array.isArray(producto.variante) && 
            producto.variante.length > 0

          if (tieneVariantes) continue

          // Verificar que la receta tenga recursos
          const recursoIds = receta.map((r: any) => r.recurso_id).filter(Boolean)
          if (recursoIds.length === 0) continue

          // Cargar recursos para verificar que tengan variantes
          const { data: recursos } = await supabaseServer
            .from('recursos')
            .select('id, variantes')
            .in('id', recursoIds)

          if (!recursos) continue

          const recursosConVariantes = recursos.filter(r => {
            if (!r.variantes) return false
            if (Array.isArray(r.variantes) && r.variantes.length > 0) return true
            if (typeof r.variantes === 'string') {
              try {
                const parsed = JSON.parse(r.variantes)
                return Array.isArray(parsed) && parsed.length > 0
              } catch {
                return false
              }
            }
            return false
          })

          if (recursosConVariantes.length === 0) continue

          // Sincronizar variantes
          await syncProductVariants(producto.id)
          actualizados++

        } catch (error: any) {
          errores.push({
            id: producto.id,
            nombre: producto.nombre || 'Sin nombre',
            error: error?.message || 'Error desconocido'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Reconstrucción completada',
        procesados,
        actualizados,
        errores: errores.length > 0 ? errores : undefined
      })
    }

    return NextResponse.json(
      { error: 'Debe especificar producto_id o todos=true' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('❌ Error reconstruyendo variantes:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al reconstruir variantes' },
      { status: 500 }
    )
  }
}

