import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const tipo = searchParams.get("tipo")
    const ciudad = searchParams.get("ciudad")
    const pais = searchParams.get("pais")
    const estado = searchParams.get("estado")

    // Construir query base
    let query = supabaseServer
      .from('clientes')
      .select('*')

    // Filtros
    if (estado) {
      query = query.eq('estado', estado)
    } else {
      query = query.eq('estado', 'activo')
    }

    if (tipo) {
      query = query.eq('tipo_cliente', tipo)
    }

    if (ciudad) {
      query = query.eq('ciudad', ciudad)
    }

    if (pais) {
      query = query.eq('pais', pais)
    }

    // Búsqueda de texto
    if (q) {
      query = query.or(`nombre_comercial.ilike.%${q}%,nombre_contacto.ilike.%${q}%,email.ilike.%${q}%,ciudad.ilike.%${q}%`)
    }

    // Obtener todos los clientes con filtros
    const { data: contacts, error } = await query
      .order('nombre_comercial', { ascending: true })

    if (error) {
      console.error('Error fetching clients from Supabase:', error)
      return NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 })
    }

    // Generar CSV
    const csvHeaders = [
      "Nombre Comercial",
      "Nombre Contacto",
      "Email",
      "Teléfono",
      "CIF/NIF",
      "Dirección",
      "Ciudad",
      "Código Postal",
      "País",
      "Tipo Cliente",
      "Estado",
      "Notas"
    ].join(",")

    const csvRows = (contacts || []).map(contact => [
      `"${contact.nombre_comercial || ""}"`,
      `"${contact.nombre_contacto || ""}"`,
      `"${contact.email || ""}"`,
      `"${contact.telefono || ""}"`,
      `"${contact.cif_nif || ""}"`,
      `"${contact.direccion || ""}"`,
      `"${contact.ciudad || ""}"`,
      `"${contact.codigo_postal || ""}"`,
      `"${contact.pais || ""}"`,
      `"${contact.tipo_cliente || ""}"`,
      `"${contact.estado || ""}"`,
      `"${(contact.notas || "").replace(/"/g, '""')}"`
    ].join(","))

    const csvContent = [csvHeaders, ...csvRows].join("\n")

    // Crear respuesta con headers para descarga
    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv; charset=utf-8")
    response.headers.set("Content-Disposition", `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.csv"`)
    
    return response
  } catch (error) {
    console.error("Error exporting contacts:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
