import { NextRequest, NextResponse } from 'next/server'
import { getProductoById, updateProducto, deleteProducto } from '@/lib/supabaseProductos'
import { recalcularYPersistirVariantes } from '@/lib/calcularVarianteFinanciera'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // FIX: Next.js 15 requiere await params
    const { id } = await context.params
    console.log('🔍 Obteniendo producto por ID:', id)

    if (!id) {
      console.error('❌ ID no proporcionado o undefined')
      return NextResponse.json(
        { success: false, error: 'ID de producto requerido' },
        { status: 400 }
      )
    }

    const producto = await getProductoById(id)

    return NextResponse.json({
      success: true,
      data: producto
    })

  } catch (error) {
    console.error('❌ Error obteniendo producto:', error)
    return NextResponse.json(
      { success: false, error: 'Producto no encontrado' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // FIX: Next.js 15 requiere await params
    const { id } = await context.params
    const body = await request.json()
    
    console.log('📝 Actualizando producto:', id)
    
    if (!id) {
      console.error('❌ ID no proporcionado o undefined')
      return NextResponse.json(
        { success: false, error: 'ID de producto requerido' },
        { status: 400 }
      )
    }
    
    console.log('📝 Body recibido:', JSON.stringify(body, null, 2))
    console.log('📝 calculadora_de_precios (tipo):', typeof body.calculadora_de_precios)
    try {
      console.log('📝 calculadora_de_precios (preview):', JSON.stringify(body.calculadora_de_precios)?.slice(0, 500))
    } catch {}

    const productoActualizado = await updateProducto(id, body)

    // Recalcular campos financieros de variantes si cambiaron coste o precio_venta
    if (body.coste !== undefined || body.precio_venta !== undefined) {
      try {
        const supabase = getSupabaseAdmin()
        const { data: prod } = await supabase
          .from('productos')
          .select('coste, precio_venta')
          .eq('id', id)
          .single()

        if (prod) {
          await recalcularYPersistirVariantes(id, prod, supabase)
        }
      } catch (recalcErr) {
        console.warn('⚠️ Error recalculando variantes tras actualizar producto:', recalcErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: productoActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando producto:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar producto'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('❌ Error details:', errorDetails)
    return NextResponse.json(
      { success: false, error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // FIX: Next.js 15 requiere await params
    const { id } = await context.params
    console.log('🗑️ Eliminando producto:', id)

    if (!id) {
      console.error('❌ ID no proporcionado o undefined')
      return NextResponse.json(
        { success: false, error: 'ID de producto requerido' },
        { status: 400 }
      )
    }

    await deleteProducto(id)

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente'
    })

  } catch (error) {
    console.error('❌ Error eliminando producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

