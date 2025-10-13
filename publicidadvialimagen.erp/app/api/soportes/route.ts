export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"
import { extractCoordinatesFromGoogleMapsLink, buildPayload, rowToSupport } from "./helpers"

// Función para normalizar nombres de ciudades (manejar acentos y variantes)
function normalizeCityName(city: string): string[] {
  const cityMap: Record<string, string[]> = {
    'Potosí': ['Potosí', 'Potosi'],
    'Beni': ['Beni', 'Trinidad'],
    'Pando': ['Pando', 'Cobija']
  }
  
  // Buscar si la ciudad coincide con alguna variante
  for (const [normalized, variants] of Object.entries(cityMap)) {
    if (variants.some(v => v.toLowerCase() === city.toLowerCase())) {
      return variants // Devolver todas las variantes para buscar en Airtable
    }
  }
  
  return [city] // Si no tiene variantes, devolver como array de un elemento
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || ''
    const cityFilter = searchParams.get('city') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    console.log('🔍 Search params:', { query, statusFilter, cityFilter, page, limit })

    // Construir filtros para Airtable
    let airtableFilter = ''
    const filterParts = []

    // Filtro de búsqueda por texto (código, título, ciudad, tipo)
    if (query) {
      const searchFilter = `OR(
        SEARCH("${query}", LOWER({Código})) > 0,
        SEARCH("${query}", LOWER({Título})) > 0,
        SEARCH("${query}", LOWER({Ciudad})) > 0,
        SEARCH("${query}", LOWER({Tipo de soporte})) > 0
      )`
      filterParts.push(searchFilter)
    }

    // Filtro de estado
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim())
      if (statuses.length === 1) {
        filterParts.push(`{Estado} = "${statuses[0]}"`)
      } else {
        const statusFilterStr = statuses.map(status => `{Estado} = "${status}"`).join(', ')
        filterParts.push(`OR(${statusFilterStr})`)
      }
    }

    // Filtro de ciudad (con soporte para variantes y acentos)
    if (cityFilter) {
      const cityVariants = normalizeCityName(cityFilter)
      if (cityVariants.length === 1) {
        filterParts.push(`{Ciudad} = "${cityVariants[0]}"`)
      } else {
        // Si hay múltiples variantes, usar OR
        const cityFilters = cityVariants.map(v => `{Ciudad} = "${v}"`).join(', ')
        filterParts.push(`OR(${cityFilters})`)
      }
    }

    // Combinar filtros
    if (filterParts.length > 0) {
      airtableFilter = filterParts.length === 1 ? filterParts[0] : `AND(${filterParts.join(', ')})`
    }

    console.log('🔍 Airtable filter:', airtableFilter)

    // Obtener registros con filtros
    const selectOptions: any = {}
    if (airtableFilter) {
      selectOptions.filterByFormula = airtableFilter
    }

    const records = await airtable("Soportes").select(selectOptions).all()

    const data = records.map((r) => {
      // Usar la función rowToSupport() que mapea correctamente todos los campos incluido lighting
      return rowToSupport({
        id: r.id,
        ...r.fields
      })
    })

    // Aplicar paginación
    const total = data.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = data.slice(startIndex, endIndex)

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    console.log('📊 Pagination:', pagination)
    console.log('📊 Data length:', paginatedData.length)

    return NextResponse.json({ 
      data: paginatedData,
      pagination 
    })
  } catch (e: any) {
    console.error("Error leyendo soportes de Airtable:", e)
    return NextResponse.json({ error: "No se pudieron obtener los soportes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.code || !body.title) {
      return NextResponse.json({ error: "Código y título son requeridos" }, { status: 400 })
    }
    
    // Construir payload con los nombres correctos de Airtable
    const payload = buildPayload(body)
    
    // Crear nuevo soporte en Airtable
    const record = await airtable("Soportes").create([{ fields: payload }])

    return NextResponse.json(rowToSupport({ 
      id: record[0].id,
      ...record[0].fields 
    }), { status: 201 })
  } catch (e: any) {
    console.error("Error creando soporte en Airtable:", e)
    return NextResponse.json({ error: "No se pudo crear el soporte" }, { status: 500 })
  }
}
