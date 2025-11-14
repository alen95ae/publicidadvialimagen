import { NextResponse } from 'next/server'
import { ensureDefaultOwnerId, mapStatusToSupabase } from '../helpers'
import { getSoportes, createSoporte, updateSoporte, deleteSoporte, getSoporteById } from '@/lib/supabaseSoportes'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update' | 'duplicate'
  data?: any
}

const CODE_REGEX = /^([A-Z]+)-(\d+)$/

async function fetchSupportsByIds(ids: string[]) {
  const supports = []
  for (const id of ids) {
    try {
      const record = await getSoporteById(id)
      if (record) {
        supports.push({
          id: record.id,
          ...record.fields
        })
      }
    } catch (error) {
      console.error(`Error fetching support ${id}:`, error)
    }
  }
  return supports
}

async function generateNextCode(prefix: string, startNumber: number) {
  let next = startNumber + 1
  while (true) {
    const candidate = `${prefix}-${next}`
    try {
      const response = await getSoportes({
        q: candidate,
        limit: 1
      })
      if (!response.records?.length) {
        return candidate
      }
      next += 1
    } catch (error) {
      console.error('Error checking code uniqueness:', error)
      return candidate
    }
  }
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

    if (action === 'duplicate') {
      const supports = await fetchSupportsByIds(ids)
      const ownerId = supports[0]?.dueno_casa_id || (await ensureDefaultOwnerId())
      let duplicated = 0

      for (const support of supports) {
        try {
          let newCode = `${support.codigo}-${Date.now().toString().slice(-4)}`
          const match = support.codigo?.match(CODE_REGEX)
          if (match) {
            const [, prefix, num] = match
            newCode = await generateNextCode(prefix, parseInt(num, 10))
          }

          // Convertir campos de formato Airtable a formato Supabase
          const insertPayload: Record<string, any> = {
            'Código': newCode,
            'Título': `${support['Título'] || support.titulo || ''} - copia`,
            'Tipo de soporte': support['Tipo de soporte'] || support.tipo_soporte || 'Unipolar',
            'Ancho': support['Ancho'] || support.ancho || null,
            'Alto': support['Alto'] || support.alto || null,
            'Ciudad': support['Ciudad'] || support.ciudad || null,
            'Estado': 'Disponible',
            'Precio por mes': support['Precio por mes'] || support.precio_mes || null,
            'Impactos diarios': support['Impactos diarios'] || support.impactos_diarios || null,
            'Enlace Google Maps': support['Enlace Google Maps'] || support.ubicacion_url || null,
            'Dirección / Notas': support['Dirección / Notas'] || support.notas || null,
            'Propietario': support['Propietario'] || support.propietario || null,
          }

          try {
            await createSoporte(insertPayload)
            duplicated += 1
          } catch (error) {
            console.error(`Error duplicating support ${support.codigo}:`, error)
          }
        } catch (dupError) {
          console.error(`Error duplicando ${support.codigo}:`, dupError)
        }
      }

      return NextResponse.json({ ok: true, duplicated })
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
      if (data?.googleMapsLink !== undefined) patch['Enlace Google Maps'] = data.googleMapsLink
      if (data?.address !== undefined) patch['Dirección / Notas'] = data.address
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
