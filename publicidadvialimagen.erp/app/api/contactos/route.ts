export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const relationFilter = searchParams.get('relation') || ''
    const kindFilter = searchParams.get('kind') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('🔍 Contact search params:', { query, relationFilter, page, limit })

    // Construir filtros para Airtable
    let airtableFilter = ''
    const filterParts = []

    // Filtro de búsqueda por Nombre, Empresa o Email (case-insensitive y exacto para email)
    if (query) {
      const q = query.replace(/"/g, '\\"')
      const qLower = query.trim().toLowerCase().replace(/"/g, '\\"')
      const nameSearch = `SEARCH("${q}", {Nombre} & '') > 0`
      const empresaSearch = `SEARCH("${q}", {Empresa} & '') > 0`
      const emailEq = `LOWER(TRIM({Email} & '')) = "${qLower}"`
      const emailContains = `FIND("${qLower}", LOWER({Email} & '')) > 0`
      filterParts.push(`OR(${nameSearch}, ${empresaSearch}, ${emailEq}, ${emailContains})`)
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

    // Filtro por tipo (kind)
    if (kindFilter && kindFilter !== 'ALL') {
      const mapped = kindFilter === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
      filterParts.push(`{Tipo de Contacto} = "${mapped}"`)
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
      displayName: r.fields['Nombre'] || r.fields['Nombre Comercial'] || r.fields['Nombre Contacto'] || '',
      legalName: r.fields['Empresa'] || r.fields['Nombre Legal'] || '',
      kind: r.fields['Tipo de Contacto'] === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
      email: r.fields['Email'] || '',
      phone: r.fields['Teléfono'] || r.fields['Telefono'] || '',
      taxId: r.fields['NIT'] || r.fields['CIF'] || '',
      address: r.fields['Dirección'] || r.fields['Direccion'] || '',
      city: r.fields['Ciudad'] || '',
      postalCode: r.fields['Código Postal'] || '',
      country: r.fields['País'] || 'Bolivia',
      relation: r.fields['Relación'] || 'Cliente',
      status: 'activo',
      notes: r.fields['Notas'] || '',
      createdAt: r.createdTime,
      updatedAt: r.createdTime
    }))

    // Ordenamiento personalizado: números primero, luego letras A-Z, sin nombre al final
    data.sort((a, b) => {
      const nameA = (a.displayName || '').trim()
      const nameB = (b.displayName || '').trim()

      // Si uno está vacío y el otro no, el vacío va al final
      if (!nameA && nameB) return 1
      if (nameA && !nameB) return -1
      if (!nameA && !nameB) return 0

      const firstCharA = nameA.charAt(0)
      const firstCharB = nameB.charAt(0)
      const isNumberA = /\d/.test(firstCharA)
      const isNumberB = /\d/.test(firstCharB)

      // Números antes que letras
      if (isNumberA && !isNumberB) return -1
      if (!isNumberA && isNumberB) return 1

      // Ambos del mismo tipo, ordenar alfabéticamente
      return nameA.localeCompare(nameB, 'es', { numeric: true, sensitivity: 'base' })
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
    
    console.log('📥 Datos recibidos:', body)
    
    // Validar campos requeridos
    if (!body.displayName || body.displayName.trim() === '') {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }
    
    // Construir payload para Airtable con validación de campos
    // Campos disponibles en Airtable: ID, Tipo de Contacto, Nombre, Relación, Email, 
    // Teléfono, NIT, Dirección, Ciudad, País, Empresa, Sitio Web
    const payload: any = {
      'Nombre': body.displayName.trim(),
    }
    
    // Solo agregar campos que tengan valor para evitar errores de validación
    // Valores válidos en Airtable: "Individual" y "Compañía"
    if (body.kind) {
      payload['Tipo de Contacto'] = body.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
    }
    
    if (body.relation) {
      // Mapear valores de relación - valores válidos: Cliente, Proveedor, Ambos
      const relationMap: { [key: string]: string } = {
        'CUSTOMER': 'Cliente',
        'SUPPLIER': 'Proveedor', 
        'BOTH': 'Ambos'
      }
      payload['Relación'] = relationMap[body.relation] || 'Cliente'
    }
    
    if (body.email && body.email.trim()) {
      payload['Email'] = body.email.trim()
    }
    
    if (body.phone && body.phone.trim()) {
      payload['Teléfono'] = body.phone.trim()
    }
    
    if (body.taxId && body.taxId.trim()) {
      payload['NIT'] = body.taxId.trim()
    }
    
    if (body.address1 && body.address1.trim()) {
      payload['Dirección'] = body.address1.trim()
    }
    
    if (body.city && body.city.trim()) {
      payload['Ciudad'] = body.city.trim()
    }
    
    if (body.country && body.country.trim()) {
      payload['País'] = body.country.trim()
    }
    
    if (body.website && body.website.trim()) {
      payload['Sitio Web'] = body.website.trim()
    }
    
    // El campo legalName se mapea a Empresa en Airtable
    if (body.legalName && body.legalName.trim()) {
      payload['Empresa'] = body.legalName.trim()
    }
    
    // También guardar el campo company si viene
    if (body.company && body.company.trim()) {
      payload['Empresa'] = body.company.trim()
    }

    console.log('🆕 Creando contacto con payload validado:', payload)

    // Crear nuevo contacto en Airtable
    const record = await airtable("Contactos").create([{ fields: payload }])

    console.log('✅ Contacto creado exitosamente:', record[0].id)

    return NextResponse.json({
      id: record[0].id,
      displayName: record[0].fields['Nombre'] || '',
      legalName: record[0].fields['Empresa'] || '',
      company: record[0].fields['Empresa'] || '',
      kind: record[0].fields['Tipo de Contacto'] === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
      email: record[0].fields['Email'] || '',
      phone: record[0].fields['Teléfono'] || '',
      taxId: record[0].fields['NIT'] || '',
      address: record[0].fields['Dirección'] || '',
      city: record[0].fields['Ciudad'] || '',
      postalCode: '',
      country: record[0].fields['País'] || '',
      website: record[0].fields['Sitio Web'] || '',
      relation: body.relation || 'CUSTOMER',
      status: 'activo',
      notes: '',
      createdAt: record[0].createdTime,
      updatedAt: record[0].createdTime
    }, { status: 201 })
  } catch (e: any) {
    console.error("❌ Error creando contacto en Airtable:", e)
    console.error("❌ Detalles del error:", e.message)
    return NextResponse.json({ 
      error: "No se pudo crear el contacto", 
      details: e.message 
    }, { status: 500 })
  }
}
