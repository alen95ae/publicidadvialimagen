import { NextRequest, NextResponse } from 'next/server'
import { airtable } from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'El archivo debe ser un CSV' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'El archivo CSV debe tener al menos una fila de datos' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataRows = lines.slice(1)

    console.log('📊 Headers:', headers)
    console.log('📊 Data rows:', dataRows.length)

    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    const errorMessages: string[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row.trim()) continue

      try {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
          errorMessages.push(`Fila ${i + 2}: Número de columnas incorrecto`)
          errors++
          continue
        }

        // Crear objeto con los datos de la fila
        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        console.log(`📊 Procesando fila ${i + 2}:`, rowData)

        // Procesar la fila
        const processedData = processCsvRow(rowData)
        
        // Verificar si ya existe un contacto con este NIT o email
        const existingRecords = await airtable('Contactos').select({
          filterByFormula: `OR({NIT} = "${processedData.taxId}", {Email} = "${processedData.email}")`,
          maxRecords: 1
        }).all()

        if (existingRecords.length > 0) {
          // Actualizar registro existente
          const payload = buildPayload(processedData, existingRecords[0].fields)
          await airtable('Contactos').update([{
            id: existingRecords[0].id,
            fields: payload
          }])
          updated++
          console.log(`✅ Actualizado: ${processedData.displayName}`)
        } else {
          // Crear nuevo registro
          const payload = buildPayload(processedData)
          await airtable('Contactos').create([{ fields: payload }])
          created++
          console.log(`✅ Creado: ${processedData.displayName}`)
        }

      } catch (error) {
        console.error(`❌ Error en fila ${i + 2}:`, error)
        errorMessages.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors,
      errorMessages
    })

  } catch (error) {
    console.error('❌ Error en importación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/** Procesa datos de CSV para importación de contactos */
function processCsvRow(row: any): any {
  return {
    displayName: row.Nombre || row.nombre || row['Nombre Comercial'] || row.nombre_comercial || '',
    legalName: row.Empresa || row.empresa || '',
    kind: (row['Tipo de Contacto'] || row.tipo_contacto || row.Tipo || row.tipo || 'Individual').toLowerCase() === 'individual' ? 'INDIVIDUAL' : 'COMPANY',
    email: row.Email || row.email || '',
    phone: row.Teléfono || row.telefono || row.Telefono || row.telefono || '',
    taxId: row.NIT || row.nit || row.CIF || row.cif || '',
    address: row.Dirección || row.direccion || row.Direccion || row.direccion || '',
    city: row.Ciudad || row.ciudad || '',
    postalCode: row['Código Postal'] || row.codigo_postal || row['Codigo Postal'] || row.codigo_postal || '',
    country: row.País || row.pais || row.Pais || row.pais || 'Bolivia',
    relation: mapRelation(row.Relación || row.relacion || row.Relacion || row.relacion || 'Cliente'),
    website: row['Sitio Web'] || row.sitio_web || row.Website || row.website || '',
    notes: row.Notas || row.notas || ''
  }
}

/** Mapea valores de relación */
function mapRelation(relation: string): string {
  const relationMap: { [key: string]: string } = {
    'cliente': 'Cliente',
    'customer': 'Cliente',
    'proveedor': 'Proveedor',
    'supplier': 'Proveedor',
    'ambos': 'Ambos',
    'both': 'Ambos'
  }
  
  const normalized = relation.toLowerCase().trim()
  return relationMap[normalized] || 'Cliente'
}

/** Construye el payload para Airtable */
function buildPayload(processedData: any, existingFields?: any): any {
  const payload: any = {
    'Nombre': processedData.displayName || '',
  }
  
  // Solo agregar campos que tengan valor
  if (processedData.kind) {
    payload['Tipo de Contacto'] = processedData.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
  }
  
  if (processedData.relation) {
    payload['Relación'] = processedData.relation
  }
  
  if (processedData.email) {
    payload['Email'] = processedData.email
  }
  
  if (processedData.phone) {
    payload['Teléfono'] = processedData.phone
  }
  
  if (processedData.taxId) {
    payload['NIT'] = processedData.taxId
  }
  
  if (processedData.address) {
    payload['Dirección'] = processedData.address
  }
  
  if (processedData.city) {
    payload['Ciudad'] = processedData.city
  }
  
  if (processedData.country) {
    payload['País'] = processedData.country
  }
  
  if (processedData.website) {
    payload['Sitio Web'] = processedData.website
  }
  
  if (processedData.legalName) {
    payload['Empresa'] = processedData.legalName
  }
  
  if (processedData.notes) {
    payload['Notas'] = processedData.notes
  }
  
  return payload
}
