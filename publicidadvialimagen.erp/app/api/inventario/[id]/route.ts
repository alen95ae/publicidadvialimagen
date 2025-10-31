import { NextRequest, NextResponse } from 'next/server'
import { getProductoById, updateProducto, deleteProducto } from '@/lib/airtableProductos'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔍 Obteniendo producto por ID:', id)

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    console.log('📝 Actualizando producto:', id, body)

    const productoActualizado = await updateProducto(id, body)

    return NextResponse.json({
      success: true,
      data: productoActualizado
    })

  } catch (error) {
    console.error('❌ Error actualizando producto:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar producto'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🗑️ Eliminando producto:', id)

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

