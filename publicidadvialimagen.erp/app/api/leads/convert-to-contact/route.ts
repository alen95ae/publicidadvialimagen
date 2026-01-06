import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { findLeadById, deleteLead } from '@/lib/supabaseLeads'
import { createContacto } from '@/lib/supabaseContactos'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { leadIds } = body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Se requieren IDs de leads' }, { status: 400 })
    }

    let convertedCount = 0
    const errors: string[] = []

    for (const leadId of leadIds) {
      try {
        // Obtener el lead
        const lead = await findLeadById(leadId)
        if (!lead) {
          errors.push(`Lead ${leadId} no encontrado`)
          continue
        }

        // Mapear campos que coinciden exactamente entre Lead y Contacto
        // Lead: nombre, empresa, email, telefono, ciudad
        // Contacto: displayName (nombre), company (empresa), email, phone (telefono), city (ciudad)
        const contactoData: any = {
          displayName: lead.nombre || undefined,
        }

        // Solo agregar campos que tienen valor
        if (lead.empresa) contactoData.company = lead.empresa
        if (lead.email) contactoData.email = lead.email
        if (lead.telefono) contactoData.phone = lead.telefono
        if (lead.ciudad) contactoData.city = lead.ciudad

        // Crear el contacto
        await createContacto(contactoData)

        // Eliminar el lead después de convertirlo
        await deleteLead(leadId)

        convertedCount++
      } catch (error: any) {
        console.error(`Error convirtiendo lead ${leadId}:`, error)
        errors.push(`Error convirtiendo lead ${leadId}: ${error.message}`)
      }
    }

    if (convertedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo convertir ningún lead', details: errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      count: convertedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error en convert-to-contact:', error)
    return NextResponse.json(
      { error: 'Error al convertir leads a contactos', details: error.message },
      { status: 500 }
    )
  }
}

