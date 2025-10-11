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

    // Filtro de búsqueda por ID
    if (query) {
      filterParts.push(`SEARCH("${query}", {ID} & '') > 0`)
    }

    // Filtro de relación
    if (relationFilter) {
      const relations = relationFilter.split(',').map(r => r.trim())
      if (relations.length === 1) {
        filterParts.push(`{Relación} = "${relations[0]}"`)
      } else {
        const relationFilterStr = relations.map(rel => `{Relación} = "${rel}"`).join(', ')
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

    // Debug: mostrar campos disponibles del primer registro
    if (records.length > 0) {
      console.log('📋 Campos disponibles en Airtable:', Object.keys(records[0].fields))
      console.log('📋 Primer registro completo:', records[0].fields)
    }

    const data = records.map((r) => ({
      id: r.id,
      displayName: `Contacto #${r.fields['ID'] || 'Sin ID'}`,
      legalName: r.fields['ID'] ? `ID: ${r.fields['ID']}` : 'Sin nombre',
      kind: r.fields['Tipo de Contacto'] === 'Individual' ? 'PERSON' : 'COMPANY',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Bolivia',
      relation: r.fields['Relación'] || 'Cliente',
      status: 'activo',
      notes: '',
      createdAt: r.createdTime,
      updatedAt: r.createdTime
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
    
    // Construir payload para Airtable usando solo campos existentes
    const payload: any = {
      'Tipo de Contacto': body.kind === 'PERSON' ? 'Individual' : 'Empresa',
      'Relación': body.relation || 'Cliente'
    }

    // Crear nuevo contacto en Airtable
    const record = await airtable("Contactos").create([{ fields: payload }])

    return NextResponse.json({
      id: record[0].id,
      displayName: `Contacto #${record[0].fields['ID'] || 'Nuevo'}`,
      legalName: record[0].fields['ID'] ? `ID: ${record[0].fields['ID']}` : '',
      kind: record[0].fields['Tipo de Contacto'] === 'Individual' ? 'PERSON' : 'COMPANY',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Bolivia',
      relation: record[0].fields['Relación'] || 'Cliente',
      status: 'activo',
      notes: '',
      createdAt: record[0].createdTime,
      updatedAt: record[0].createdTime
    }, { status: 201 })
  } catch (e: any) {
    console.error("Error creando contacto en Airtable:", e)
    return NextResponse.json({ error: "No se pudo crear el contacto" }, { status: 500 })
  }
}
