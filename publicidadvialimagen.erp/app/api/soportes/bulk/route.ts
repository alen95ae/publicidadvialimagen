import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { ensureDefaultOwnerId, mapStatusToSupabase } from '../helpers'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update' | 'duplicate'
  data?: any
}

const CODE_REGEX = /^([A-Z]+)-(\d+)$/

async function fetchSupportsByIds(ids: string[]) {
  const { data, error } = await supabaseServer
    .from('soportes')
    .select('*')
    .in('id', ids)

  if (error) throw new Error(error.message)
  return data || []
}

async function generateNextCode(prefix: string, startNumber: number) {
  let next = startNumber + 1
  while (true) {
    const candidate = `${prefix}-${next}`
    const { data } = await supabaseServer
      .from('soportes')
      .select('codigo')
      .eq('codigo', candidate)
      .maybeSingle()

    if (!data) return candidate
    next += 1
  }
}

export async function POST(req: Request) {
  try {
    const { ids, action, data }: BulkRequest = await req.json()

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await supabaseServer
        .from('soportes')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('Error eliminando soportes:', error)
        return NextResponse.json({ error: 'Error eliminando soportes' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, count: ids.length })
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
            tipo: support.tipo,
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
          }

          const { error } = await supabaseServer
            .from('soportes')
            .insert([insertPayload])

          if (error) {
            console.error(`Error duplicando ${support.codigo}:`, error)
          } else {
            duplicated += 1
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

        const { error } = await supabaseServer
          .from('soportes')
          .update({ codigo: newCode })
          .eq('id', ids[0])

        if (error) {
          return NextResponse.json({ error: 'Código duplicado o inválido' }, { status: 409 })
        }

        return NextResponse.json({ ok: true, count: 1 })
      }

      const patch: Record<string, any> = {}
      if (data?.status) patch.estado = mapStatusToSupabase(data.status)
      if (data?.type) patch.tipo = data.type
      if (data?.title) patch.titulo = data.title
      if (data?.priceMonth !== undefined) patch.precio_mes = Number(data.priceMonth) || 0

      if (data?.owner) {
        patch.Propietario = data.owner
      }

      if (!Object.keys(patch).length) {
        return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 })
      }

      const { error, count } = await supabaseServer
        .from('soportes')
        .update(patch)
        .in('id', ids)
        .select('id')

      if (error) {
        console.error('Error en actualización masiva:', error)
        return NextResponse.json({ error: 'Error actualizando soportes' }, { status: 500 })
      }

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
