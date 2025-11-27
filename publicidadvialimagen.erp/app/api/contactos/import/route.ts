import { NextRequest, NextResponse } from 'next/server'
import { createContacto, updateContacto, findDuplicateContactosByEmail, getAllContactos } from '@/lib/supabaseContactos'

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

    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    const errorMessages: string[] = []

    // Obtener todos los contactos existentes para verificar duplicados
    const existingContactos = await getAllContactos()
    const contactosByEmail = new Map(
      existingContactos
        .filter(c => c.email)
        .map(c => [c.email.toLowerCase(), c])
    )
    const contactosByTaxId = new Map(
      existingContactos
        .filter(c => c.taxId)
        .map(c => [c.taxId.toLowerCase(), c])
    )

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
        
        // Verificar si ya existe un contacto con este email o NIT
        let existingContacto = null
        if (processedData.email) {
          existingContacto = contactosByEmail.get(processedData.email.toLowerCase())
        }
        if (!existingContacto && processedData.taxId) {
          existingContacto = contactosByTaxId.get(processedData.taxId.toLowerCase())
        }

        if (existingContacto) {
          // Actualizar registro existente
          await updateContacto(existingContacto.id, processedData)
          updated++
          console.log(`✅ Actualizado: ${processedData.displayName}`)
        } else {
          // Crear nuevo registro
          await createContacto(processedData)
          created++
          console.log(`✅ Creado: ${processedData.displayName}`)
        }

      } catch (error) {
        console.error(`❌ Error en fila ${i + 2}:`, error)
        errorMessages.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        errors++
      }
    }

    console.log(`✅ Importación completada: ${created} creados, ${updated} actualizados, ${errors} errores`)

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
    company: row.Empresa || row.empresa || '',
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
    'CUSTOMER': 'Cliente',
    'proveedor': 'Proveedor',
    'supplier': 'Proveedor',
    'SUPPLIER': 'Proveedor',
    'ambos': 'Ambos',
    'both': 'Ambos',
    'BOTH': 'Ambos'
  }
  
  const normalized = relation.toLowerCase().trim()
  return relationMap[normalized] || 'Cliente'
}
