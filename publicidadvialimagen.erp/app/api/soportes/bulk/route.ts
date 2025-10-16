import { NextResponse } from 'next/server'
import { ensureDefaultOwnerId, mapStatusToSupabase } from '../helpers'
import { getSoportes, createSoporte, updateSoporte, deleteSoporte } from '@/lib/airtableSoportes'

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
      const response = await getSoportes({
        filterByFormula: `RECORD_ID() = '${id}'`
      })
      if (response.records?.[0]) {
        supports.push({
          id: response.records[0].id,
          ...response.records[0].fields
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
        filterByFormula: `{Codigo} = '${candidate}'`
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

          const insertPayload = {
            codigo: newCode,
            titulo: `${support.titulo} - copia`,
            tipo_soporte: support.tipo_soporte,
            ancho: support.ancho,
            alto: support.alto,
            ciudad: support.ciudad,
            estado: 'disponible',
            precio_mes: support.precio_mes,
            impactos_diarios: support.impactos_diarios,
            ubicacion_url: support.ubicacion_url,
            foto_url: support.foto_url,
            foto_url_2: support.foto_url_2,
            foto_url_3: support.foto_url_3,
            notas: support.notas,
            dueno_casa_id: ownerId,
            empleado_responsable_id: support.empleado_responsable_id,
            fecha_instalacion: support.fecha_instalacion,
            fecha_ultimo_mantenimiento: support.fecha_ultimo_mantenimiento,
            proximo_mantenimiento: support.proximo_mantenimiento,
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
          await updateSoporte(ids[0], { 'Codigo': newCode })
        } catch (error) {
          console.error('Error updating code:', error)
          return NextResponse.json({ error: 'Error actualizando código' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, count: 1 })
      }

      const patch: Record<string, any> = {}
      if (data?.status) patch.estado = mapStatusToSupabase(data.status)
      if (data?.type) patch.tipo_soporte = data.type
      if (data?.title) patch.titulo = data.title
      if (data?.priceMonth !== undefined) patch.precio_mes = Number(data.priceMonth) || 0
      if (data?.widthM !== undefined) patch.ancho = Number(data.widthM) || 0
      if (data?.heightM !== undefined) patch.alto = Number(data.heightM) || 0
      if (data?.city !== undefined) patch.ciudad = data.city
      if (data?.impactosDiarios !== undefined) patch.impactos_diarios = Number(data.impactosDiarios) || 0
      if (data?.googleMapsLink !== undefined) patch.ubicacion_url = data.googleMapsLink
      if (data?.address !== undefined) patch.notas = data.address
      if (data?.ownerId !== undefined) patch.dueno_casa_id = data.ownerId

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
