export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllContactos, createContacto } from "@/lib/supabaseContactos"

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

    console.log('🔍 Contact search params:', { query, relationFilter, kindFilter, page, limit: limit || 'sin límite' })

    // Obtener contactos de Supabase con filtros
    const contactos = await getAllContactos({
      query,
      relation: relationFilter,
      kind: kindFilter
    })

    console.log(`✅ Obtenidos ${contactos.length} contactos de Supabase`)

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

      console.log('📊 Contact pagination:', pagination)
      console.log('📊 Contact data length:', paginatedData.length)

      return NextResponse.json({ 
        data: paginatedData,
        pagination 
      })
    } else {
      // Sin límite, devolver todos los contactos
      console.log('📊 Devolviendo todos los contactos:', total)
      
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
    
    console.log('📥 Datos recibidos:', body)
    
    // Validar campos requeridos
    if (!body.displayName || body.displayName.trim() === '') {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Preparar datos del contacto
    const contactoData: any = {
      displayName: body.displayName.trim(),
      kind: body.kind || 'INDIVIDUAL',
      relation: body.relation || 'CUSTOMER',
      country: body.country || 'Bolivia',
      status: 'activo'
    }

    // Agregar campos opcionales si existen
    if (body.legalName && body.legalName.trim()) {
      contactoData.legalName = body.legalName.trim()
      contactoData.company = body.legalName.trim()
    }
    
    if (body.company && body.company.trim()) {
      contactoData.company = body.company.trim()
      if (!contactoData.legalName) {
        contactoData.legalName = body.company.trim()
      }
    }
    
    if (body.email && body.email.trim()) {
      contactoData.email = body.email.trim()
    }
    
    if (body.phone && body.phone.trim()) {
      contactoData.phone = body.phone.trim()
    }
    
    if (body.taxId && body.taxId.trim()) {
      contactoData.taxId = body.taxId.trim()
    }
    
    if (body.address1 && body.address1.trim()) {
      contactoData.address = body.address1.trim()
    } else if (body.address && body.address.trim()) {
      contactoData.address = body.address.trim()
    }
    
    if (body.city && body.city.trim()) {
      contactoData.city = body.city.trim()
    }
    
    if (body.postalCode && body.postalCode.trim()) {
      contactoData.postalCode = body.postalCode.trim()
    }
    
    if (body.website && body.website.trim()) {
      contactoData.website = body.website.trim()
    }
    
    if (body.notes && body.notes.trim()) {
      contactoData.notes = body.notes.trim()
    }

    console.log('🆕 Creando contacto en Supabase:', contactoData)

    // Crear contacto en Supabase
    const nuevoContacto = await createContacto(contactoData)

    console.log('✅ Contacto creado exitosamente:', nuevoContacto.id)

    return NextResponse.json(nuevoContacto, { status: 201 })
  } catch (e: any) {
    console.error("❌ Error creando contacto en Supabase:", e)
    console.error("❌ Detalles del error:", e.message)
    return NextResponse.json({ 
      error: "No se pudo crear el contacto", 
      details: e.message 
    }, { status: 500 })
  }
}
