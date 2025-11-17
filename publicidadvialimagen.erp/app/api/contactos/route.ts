export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllContactos, createContacto, type Contacto } from "@/lib/supabaseContactos"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const relationFilter = searchParams.get('relation') || ''
    const kindFilter = searchParams.get('kind') || ''
    const page = parseInt(searchParams.get('page') || '1')
    // Solo aplicar límite si viene explícitamente en la URL
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Obtener contactos de Supabase con filtros
    const contactos = await getAllContactos({
      query,
      relation: relationFilter,
      kind: kindFilter
    })

    // Ordenamiento personalizado: números primero, luego letras A-Z, sin nombre al final
    contactos.sort((a, b) => {
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

    // Aplicar paginación solo si se especificó un límite
    const total = contactos.length
    
    if (limit) {
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = contactos.slice(startIndex, endIndex)

      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      return NextResponse.json({ 
        data: paginatedData,
        pagination 
      })
    } else {
      // Sin límite, devolver todos los contactos
      return NextResponse.json({ 
        data: contactos,
        pagination: {
          page: 1,
          limit: total,
          total,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      })
    }
  } catch (e: any) {
    console.error("❌ Error leyendo contactos de Supabase:", e)
    return NextResponse.json({ error: "No se pudieron obtener los contactos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validar campos requeridos
    if (!body.displayName || typeof body.displayName !== 'string' || body.displayName.trim() === '') {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Preparar datos del contacto con validación
    const contactoData: Partial<Contacto> = {
      displayName: body.displayName.trim(),
      kind: (body.kind === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL') as 'INDIVIDUAL' | 'COMPANY',
      relation: body.relation || 'CUSTOMER',
      country: body.country || 'Bolivia'
    }

    // Agregar campos opcionales solo si tienen valor
    if (body.company && typeof body.company === 'string' && body.company.trim()) {
      contactoData.company = body.company.trim()
    }
    
    if (body.email && typeof body.email === 'string' && body.email.trim()) {
      contactoData.email = body.email.trim()
    }
    
    if (body.phone && typeof body.phone === 'string' && body.phone.trim()) {
      contactoData.phone = body.phone.trim()
    }
    
    if (body.taxId && typeof body.taxId === 'string' && body.taxId.trim()) {
      contactoData.taxId = body.taxId.trim()
    }
    
    // Mapear address1 a address
    if (body.address1 && typeof body.address1 === 'string' && body.address1.trim()) {
      contactoData.address = body.address1.trim()
    } else if (body.address && typeof body.address === 'string' && body.address.trim()) {
      contactoData.address = body.address.trim()
    }
    
    if (body.city && typeof body.city === 'string' && body.city.trim()) {
      contactoData.city = body.city.trim()
    }
    
    if (body.postalCode && typeof body.postalCode === 'string' && body.postalCode.trim()) {
      contactoData.postalCode = body.postalCode.trim()
    }
    
    if (body.website && typeof body.website === 'string' && body.website.trim()) {
      contactoData.website = body.website.trim()
    }
    
    // Notas: aceptar string vacío
    if (body.notes !== undefined) {
      contactoData.notes = typeof body.notes === 'string' ? body.notes : String(body.notes || '')
    }

    // Sales Owner ID: mapear a comercial en Supabase
    if (body.salesOwnerId !== undefined) {
      contactoData.salesOwnerId = body.salesOwnerId === 'none' || body.salesOwnerId === null ? null : body.salesOwnerId
    }

    // Crear contacto en Supabase
    const nuevoContacto = await createContacto(contactoData)

    // Devolver el contacto creado en el formato esperado por el frontend
    return NextResponse.json(nuevoContacto, { status: 201 })
  } catch (e: any) {
    // Log detallado del error para debugging
    console.error("❌ Error en POST /api/contactos:")
    console.error("   Mensaje:", e.message)
    console.error("   Stack:", e.stack)
    
    // Devolver error con mensaje claro
    return NextResponse.json(
      { 
        error: "No se pudo crear el contacto",
        details: e.message || "Error desconocido"
      },
      { status: 500 }
    )
  }
}
