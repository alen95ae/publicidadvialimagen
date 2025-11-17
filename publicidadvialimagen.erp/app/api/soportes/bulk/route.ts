import { NextResponse } from 'next/server'
import { getSoportes, updateSoporte, deleteSoporte } from '@/lib/supabaseSoportes'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update'
  data?: any
}

export async function POST(req: Request) {
  try {
    const { ids, action, data }: BulkRequest = await req.json()

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    if (action === 'delete') {
      let deletedCount = 0
      for (const id of ids) {
        try {
          await deleteSoporte(id)
          deletedCount += 1
        } catch (error) {
          console.error(`Error deleting support ${id}:`, error)
        }
      }
      return NextResponse.json({ ok: true, count: deletedCount })
    }

    if (action === 'update') {
      if (data?.__codeSingle) {
        if (ids.length !== 1) {
          return NextResponse.json({ error: 'Código: seleccione solo 1 elemento' }, { status: 400 })
        }

        const newCode = String(data.__codeSingle).trim()
        if (!newCode) {
          return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
        }

        try {
          await updateSoporte(ids[0], { 'Código': newCode })
        } catch (error) {
          console.error('Error updating code:', error)
          return NextResponse.json({ error: 'Error actualizando código' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, count: 1 })
      }

      const patch: Record<string, any> = {}
      if (data?.status) patch['Estado'] = data.status // Mantener formato original, no mapear
      if (data?.type) patch['Tipo de soporte'] = data.type
      if (data?.title) patch['Título'] = data.title
      if (data?.priceMonth !== undefined) patch['Precio por mes'] = Number(data.priceMonth) || 0
      if (data?.widthM !== undefined) patch['Ancho'] = Number(data.widthM) || 0
      if (data?.heightM !== undefined) patch['Alto'] = Number(data.heightM) || 0
      if (data?.city !== undefined) patch['Ciudad'] = data.city
      if (data?.impactosDiarios !== undefined) patch['Impactos diarios'] = Number(data.impactosDiarios) || 0
      if (data?.googleMapsLink !== undefined) patch['Enlace Google Maps'] = data.googleMapsLink || null
      if (data?.address !== undefined) patch['Dirección / Notas'] = data.address || null
      if (data?.latitude !== undefined) patch['Latitud'] = Number(data.latitude) || null
      if (data?.longitude !== undefined) patch['Longitud'] = Number(data.longitude) || null
      if (data?.owner !== undefined) patch['Propietario'] = data.owner

      if (!Object.keys(patch).length) {
        return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 })
      }

      let updatedCount = 0
      for (const id of ids) {
        try {
          await updateSoporte(id, patch)
          updatedCount += 1
        } catch (error) {
          console.error(`Error updating support ${id}:`, error)
        }
      }
      const count = updatedCount

      return NextResponse.json({ ok: true, count: count ?? ids.length })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error("Error in bulk action:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
