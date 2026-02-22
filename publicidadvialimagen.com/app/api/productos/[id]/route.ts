import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/productos/[id]
 * Obtiene un producto específico con sus variantes desde la base de datos
 * Incluye precios de la sucursal Santa Cruz
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    const productoId = params.id
    
    // Obtener producto
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single()
    
    if (productoError || !producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    // Obtener variantes del producto (solo las de Santa Cruz o sin sucursal)
    const { data: variantes, error: variantesError } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', productoId)
      .order('combinacion', { ascending: true })
    
    // Filtrar variantes para mostrar solo las de Santa Cruz o sin sucursal
    const variantesFiltradas = (variantes || []).filter((v: any) => {
      if (!v.combinacion) return true
      // Si tiene sucursal en la combinación, solo mostrar Santa Cruz
      if (v.combinacion.includes('Sucursal:')) {
        return v.combinacion.includes('Sucursal:Santa Cruz')
      }
      // Si no tiene sucursal, incluirla
      return true
    })
    
    // Parsear imagen_portada
    let imagenPortada = producto.imagen_portada || producto.imagen_principal
    if (imagenPortada && typeof imagenPortada === 'string') {
      try {
        const parsed = JSON.parse(imagenPortada)
        if (parsed && typeof parsed === 'object' && parsed.url) {
          imagenPortada = parsed.url
        }
      } catch {
        // Si no es JSON, usar el valor directamente
      }
    } else if (imagenPortada && typeof imagenPortada === 'object' && imagenPortada.url) {
      imagenPortada = imagenPortada.url
    }
    
    // Parsear variantes del producto (si están en JSONB) - solo como fallback
    let variantesProductoFallback: any[] = []
    if (producto.variantes) {
      try {
        if (typeof producto.variantes === 'string') {
          variantesProductoFallback = JSON.parse(producto.variantes)
        } else if (Array.isArray(producto.variantes)) {
          variantesProductoFallback = producto.variantes
        }
      } catch {
        variantesProductoFallback = []
      }
    }
    
    // SIEMPRE intentar obtener variantes desde los recursos (tienen el formato completo con hex)
    // Esto es más preciso que las variantes guardadas en el producto (que pueden no tener hex)
    let variantesProducto: any[] = []
    if (producto.receta) {
      try {
        // Parsear receta
        let recetaItems: any[] = []
        if (typeof producto.receta === 'string') {
          recetaItems = JSON.parse(producto.receta)
        } else if (Array.isArray(producto.receta)) {
          recetaItems = producto.receta
        } else if (producto.receta && typeof producto.receta === 'object' && producto.receta.items) {
          recetaItems = Array.isArray(producto.receta.items) ? producto.receta.items : []
        }
        
        // Obtener IDs de recursos
        const recursoIds = recetaItems.map((item: any) => item.recurso_id).filter(Boolean)
        
        if (recursoIds.length > 0) {
          // Obtener recursos con sus variantes
          const { data: recursos, error: recursosError } = await supabase
            .from('recursos')
            .select('id, variantes')
            .in('id', recursoIds)
          
          if (!recursosError && recursos) {
            // Extraer variantes de los recursos con formato completo "Nombre:#hex"
            const variantesMap = new Map<string, Set<string>>() // nombre -> Set<valores únicos>
            
            recursos.forEach((recurso: any) => {
              let variantesRecurso: any[] = []
              if (recurso.variantes) {
                try {
                  if (typeof recurso.variantes === 'string') {
                    variantesRecurso = JSON.parse(recurso.variantes)
                  } else if (Array.isArray(recurso.variantes)) {
                    variantesRecurso = recurso.variantes
                  }
                } catch {
                  variantesRecurso = []
                }
              }
              
              variantesRecurso.forEach((v: any) => {
                const nombre = v.nombre
                const valores = v.valores || v.posibilidades || []
                
                if (!nombre || !Array.isArray(valores) || valores.length === 0) return
                
                if (!variantesMap.has(nombre)) {
                  variantesMap.set(nombre, new Set()) // Cambiar a Set para mantener valores únicos
                }
                
                valores.forEach((valor: string) => {
                  // Mantener TODOS los valores únicos, incluso si tienen el mismo nombre pero diferente hex
                  // Usar Set para asegurar que no haya duplicados
                  if (valor && typeof valor === 'string' && valor.trim()) {
                    variantesMap.get(nombre)!.add(valor.trim())
                  }
                })
              })
            })
            
            // Construir array de variantes con valores completos
            // Mantener todos los valores únicos (pueden tener mismo nombre pero diferente hex)
            const variantesDesdeRecursos = Array.from(variantesMap.entries()).map(([nombre, valoresSet]) => ({
              nombre,
              valores: Array.from(valoresSet).sort() // Convertir Set a Array y ordenar
            }))
            
            // Si hay variantes desde recursos, usarlas (tienen formato completo con hex)
            // Si no, usar las del producto como fallback
            if (variantesDesdeRecursos.length > 0) {
              variantesProducto = variantesDesdeRecursos
              console.log(`✅ Variantes desde recursos para producto ${productoId}:`, variantesDesdeRecursos.map(v => ({ nombre: v.nombre, cantidad: v.valores.length })))
            } else if (variantesProductoFallback.length > 0) {
              // Fallback: usar variantes del producto si no se encontraron en recursos
              variantesProducto = variantesProductoFallback
              console.log(`⚠️ Usando variantes fallback para producto ${productoId}:`, variantesProductoFallback.map(v => ({ nombre: v.nombre, cantidad: (v.valores || v.posibilidades || []).length })))
            }
          } else {
            // Si no hay recursos, usar fallback
            if (variantesProductoFallback.length > 0) {
              variantesProducto = variantesProductoFallback
              console.log(`⚠️ No se encontraron recursos, usando variantes fallback para producto ${productoId}`)
            }
          }
        } else {
          // Si no hay receta, usar fallback
          if (variantesProductoFallback.length > 0) {
            variantesProducto = variantesProductoFallback
            console.log(`⚠️ No hay receta, usando variantes fallback para producto ${productoId}`)
          }
        }
      } catch (error) {
        console.error('❌ Error obteniendo variantes desde recursos:', error)
        // En caso de error, usar fallback
        if (variantesProductoFallback.length > 0) {
          variantesProducto = variantesProductoFallback
        }
      }
    } else {
      // Si no hay receta, usar fallback
      if (variantesProductoFallback.length > 0) {
        variantesProducto = variantesProductoFallback
      }
    }
    
    // Preparar respuesta
    const productoData = {
      id: producto.id,
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      imagen_portada: imagenPortada || null,
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || '',
      precio_venta: Number(producto.precio_venta) || 0,
      coste: Number(producto.coste) || 0,
      mostrar_en_web: producto.mostrar_en_web || false,
      variantes: variantesProducto,
      variantes_detalle: variantesFiltradas.map((v: any) => ({
        id: v.id,
        combinacion: v.combinacion,
        precio_override: v.precio_override ? Number(v.precio_override) : null,
        precio_calculado: v.precio_calculado ? Number(v.precio_calculado) : null,
        coste_override: v.coste_override ? Number(v.coste_override) : null,
        coste_calculado: v.coste_calculado ? Number(v.coste_calculado) : null,
      })),
      fecha_creacion: producto.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: producto.fecha_actualizacion || new Date().toISOString(),
    }
    
    return NextResponse.json({
      success: true,
      data: productoData
    })
  } catch (error) {
    console.error('❌ Error en GET /api/productos/[id]:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener producto'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
