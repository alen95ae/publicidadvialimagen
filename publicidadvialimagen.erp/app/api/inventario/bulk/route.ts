import { NextRequest, NextResponse } from 'next/server'
import { getAllProductos, updateProducto, deleteProducto } from '@/lib/supabaseProductos'

export async function POST(request: NextRequest) {
  try {
    const { ids, action, data } = await request.json()
    console.log(`📦 Bulk action: ${action} for IDs:`, ids, 'with data:', data)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No IDs provided for bulk action' }, { status: 400 })
    }

    let results: any[] = []
    let errors: string[] = []

    if (action === 'update') {
      for (const id of ids) {
        try {
          const updated = await updateProducto(id, data)
          results.push(updated)
        } catch (error: any) {
          console.error(`❌ Error updating product ${id}:`, error)
          errors.push(`Error updating ${id}: ${error.message || 'Unknown error'}`)
        }
      }
    } else if (action === 'delete') {
      for (const id of ids) {
        try {
          await deleteProducto(id)
          results.push({ id, status: 'deleted' })
        } catch (error: any) {
          console.error(`❌ Error deleting product ${id}:`, error)
          errors.push(`Error deleting ${id}: ${error.message || 'Unknown error'}`)
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid bulk action' }, { status: 400 })
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: 'Some operations failed', errors, results }, { status: 207 })
    }

    return NextResponse.json({ success: true, message: `${ids.length} productos ${action}d correctamente`, results })

  } catch (error) {
    console.error('❌ Error en API bulk productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
