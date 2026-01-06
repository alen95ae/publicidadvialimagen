import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { restoreLeads } from '@/lib/supabaseLeads'

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

    const count = await restoreLeads(leadIds)

    if (count === 0) {
      return NextResponse.json(
        { error: 'No se pudo restaurar ningún lead' },
        { status: 400 }
      )
    }

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error en restore leads:', error)
    return NextResponse.json(
      { error: 'Error al restaurar leads', details: error.message },
      { status: 500 }
    )
  }
}

