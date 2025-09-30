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
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const skip = (page - 1) * pageSize

    // Construir query base
    let query = supabaseServer
      .from('clientes')
      .select('*', { count: 'exact' })

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

    // Aplicar paginación y ordenamiento
    const { data: contacts, error, count } = await query
      .order('nombre_comercial', { ascending: true })
      .range(skip, skip + pageSize - 1)

    if (error) {
      console.error('Error fetching clients from Supabase:', error)
      return NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 })
    }

    const total = count || 0

    return NextResponse.json({
      items: contacts || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validación básica
    if (!data.nombre_comercial) {
      return NextResponse.json(
        { error: "Nombre comercial es requerido" },
        { status: 400 }
      )
    }

    // Crear cliente en Supabase
    const { data: contact, error } = await supabaseServer
      .from('clientes')
      .insert([{
        nombre_comercial: data.nombre_comercial,
        nombre_contacto: data.nombre_contacto,
        email: data.email,
        telefono: data.telefono,
        cif_nif: data.cif_nif,
        direccion: data.direccion,
        ciudad: data.ciudad,
        codigo_postal: data.codigo_postal,
        pais: data.pais || 'Bolivia',
        tipo_cliente: data.tipo_cliente || 'empresa',
        estado: data.estado || 'activo',
        notas: data.notas
      }])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating client in Supabase:', error)
      return NextResponse.json({ error: 'Error creando cliente' }, { status: 500 })
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
