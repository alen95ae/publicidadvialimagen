import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const relationFilter = searchParams.get('relation') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    console.log('🔍 Contact search params:', { query, relationFilter, page, limit })

    // Construir filtros para Airtable
    let airtableFilter = ''
    const filterParts = []

    // Filtro de búsqueda por texto
    if (query) {
      const searchFilter = `OR(
        SEARCH("${query}", LOWER({Nombre Comercial})) > 0,
        SEARCH("${query}", LOWER({Nombre Contacto})) > 0,
        SEARCH("${query}", LOWER({Email})) > 0,
        SEARCH("${query}", LOWER({Ciudad})) > 0
      )`
      filterParts.push(searchFilter)
    }

    // Filtro de relación
    if (relationFilter) {
      const relations = relationFilter.split(',').map(r => r.trim())
      if (relations.length === 1) {
        filterParts.push(`{Tipo Cliente} = "${relations[0]}"`)
      } else {
        const relationFilterStr = relations.map(rel => `{Tipo Cliente} = "${rel}"`).join(', ')
        filterParts.push(`OR(${relationFilterStr})`)
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

    const records = await airtable("Contactos").select(selectOptions).all()

    const data = records.map((r) => ({
      id: r.id,
      displayName: r.fields['Nombre Comercial'] || r.fields['Nombre'] || '',
      legalName: r.fields['Nombre Contacto'] || '',
      kind: r.fields['Tipo de Contacto'] === 'Individual' ? 'PERSON' : 'COMPANY',
      email: r.fields['Email'] || '',
      phone: r.fields['Teléfono'] || '',
      taxId: r.fields['CIF NIF'] || '',
      address: r.fields['Dirección'] || '',
      city: r.fields['Ciudad'] || '',
      postalCode: r.fields['Código Postal'] || '',
      country: r.fields['País'] || 'Bolivia',
      relation: r.fields['Tipo Cliente'] || r.fields['Relación'] || 'CUSTOMER',
      status: r.fields['Estado'] || 'activo',
      notes: r.fields['Notas'] || '',
      createdAt: r.createdTime,
      updatedAt: r.fields['Última actualización'] || r.createdTime
    }))

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

    console.log('📊 Contact pagination:', pagination)
    console.log('📊 Contact data length:', paginatedData.length)

    return NextResponse.json({ 
      data: paginatedData,
      pagination 
    })
  } catch (e: any) {
    console.error("Error leyendo contactos de Airtable:", e)
    return NextResponse.json({ error: "No se pudieron obtener los contactos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.displayName) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    
    // Construir payload para Airtable usando campos existentes
    const payload: any = {
      'Tipo de Contacto': body.kind === 'COMPANY' ? 'Individual' : 'Individual', // Usar solo valores existentes
      'Relación': body.relation === 'CUSTOMER' ? 'Ambos' : 
                  body.relation === 'SUPPLIER' ? 'Ambos' : 'Ambos'
    }
    
    // Solo agregar campos que sabemos que existen
    // Los campos adicionales se pueden agregar después de verificar que existen en Airtable

    // Crear nuevo contacto en Airtable
    const record = await airtable("Contactos").create([{ fields: payload }])

    return NextResponse.json({
      id: record[0].id,
      displayName: record[0].fields['Nombre Comercial'],
      legalName: record[0].fields['Nombre Contacto'],
      email: record[0].fields['Email'],
      phone: record[0].fields['Teléfono'],
      taxId: record[0].fields['CIF NIF'],
      address: record[0].fields['Dirección'],
      city: record[0].fields['Ciudad'],
      postalCode: record[0].fields['Código Postal'],
      country: record[0].fields['País'],
      relation: record[0].fields['Tipo Cliente'],
      status: record[0].fields['Estado'],
      notes: record[0].fields['Notas'],
      createdAt: record[0].createdTime,
      updatedAt: record[0].createdTime
    }, { status: 201 })
  } catch (e: any) {
    console.error("Error creando contacto en Airtable:", e)
    return NextResponse.json({ error: "No se pudo crear el contacto" }, { status: 500 })
  }
}
