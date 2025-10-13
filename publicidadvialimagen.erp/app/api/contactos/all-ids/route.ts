import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const relationFilter = searchParams.get('relation') || ''
    const kindFilter = searchParams.get('kind') || ''

    // Construir filtros para Airtable
    let airtableFilter = ''
    const filterParts = []

    // Filtro de búsqueda
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

    // Filtro de tipo
    if (kindFilter) {
      const kinds = kindFilter.split(',').map(k => k.trim())
      const mappedKinds = kinds.map(k => {
        if (k === 'INDIVIDUAL') return 'Individual'
        if (k === 'COMPANY') return 'Compañía'
        return k
      })
      if (mappedKinds.length === 1) {
        filterParts.push(`{Tipo de Contacto} = "${mappedKinds[0]}"`)
      } else {
        const kindFilterStr = mappedKinds.map(k => `{Tipo de Contacto} = "${k}"`).join(', ')
        filterParts.push(`OR(${kindFilterStr})`)
      }
    }

    if (filterParts.length > 0) {
      airtableFilter = filterParts.length === 1 ? filterParts[0] : `AND(${filterParts.join(', ')})`
    }

    // Obtener todos los registros (sin paginación)
    const records = await airtable("Contactos")
      .select({
        filterByFormula: airtableFilter || undefined,
        fields: ['Nombre'], // Obtener ID y Nombre para ordenar
      })
      .all()

    // Crear array con ID y nombre para ordenar
    const contactsData = records.map(record => ({
      id: record.id,
      name: (record.fields['Nombre'] || '').toString().trim()
    }))

    // Ordenamiento personalizado: números primero, luego letras A-Z, sin nombre al final
    contactsData.sort((a, b) => {
      const nameA = a.name
      const nameB = b.name

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

    const ids = contactsData.map(c => c.id)

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("Error obteniendo IDs de contactos:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}

