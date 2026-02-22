import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/productos
 * Obtiene productos de impresión digital desde la base de datos
 * Solo retorna productos donde mostrar_en_web = true
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Obtener productos con mostrar_en_web = true
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('mostrar_en_web', true)
      .order('fecha_creacion', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo productos:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Transformar datos de Supabase al formato esperado
    const productos = (data || []).map((producto: any) => {
      // Parsear imagen_portada si es JSONB
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
      
      return {
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
        fecha_creacion: producto.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: producto.fecha_actualizacion || new Date().toISOString(),
      }
    })
    
    return NextResponse.json({
      success: true,
      data: productos,
      count: productos.length
    })
  } catch (error) {
    console.error('❌ Error en GET /api/productos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener productos'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
