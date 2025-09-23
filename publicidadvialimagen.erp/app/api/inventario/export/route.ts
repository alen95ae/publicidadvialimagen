import { supabaseServer } from "@/lib/supabaseServer"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const categoria = searchParams.get("categoria") || ""

    console.log('Exporting inventario with params:', { q, categoria })

    let query = supabaseServer
      .from('inventario')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros de búsqueda
    if (q) {
      query = query.or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%,categoria.ilike.%${q}%`)
    }

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Supabase error exporting inventario:', error)
      return NextResponse.json({ 
        error: 'Error al exportar inventario', 
        details: error.message 
      }, { status: 500 })
    }

    // Generar CSV
    const csvHeaders = [
      "Código",
      "Nombre",
      "Descripción",
      "Categoría",
      "Cantidad",
      "Unidad de Medida",
      "Coste",
      "Precio de Venta",
      "Responsable",
      "Disponibilidad",
      "Fecha Última Actualización"
    ].join(",")

    const csvRows = (items || []).map(item => [
      `"${item.codigo || ""}"`,
      `"${item.nombre || ""}"`,
      `"${(item.descripcion || "").replace(/"/g, '""')}"`,
      `"${item.categoria || ""}"`,
      `"${item.cantidad || 0}"`,
      `"${item.unidad_medida || ""}"`,
      `"${item.coste || 0}"`,
      `"${item.precio_venta || 0}"`,
      `"${item.responsable || ""}"`,
      `"${item.disponibilidad || ""}"`,
      `"${item.updated_at ? new Date(item.updated_at).toLocaleDateString('es-ES') : ""}"`
    ].join(","))

    const csvContent = [csvHeaders, ...csvRows].join("\n")

    // Crear respuesta con headers para descarga
    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv; charset=utf-8")
    response.headers.set("Content-Disposition", `attachment; filename="inventario_${new Date().toISOString().split('T')[0]}.csv"`)
    
    return response
  } catch (error) {
    console.error("Error exporting inventory:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
