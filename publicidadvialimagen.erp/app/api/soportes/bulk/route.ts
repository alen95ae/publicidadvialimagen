import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { ids, action, data } = await req.json() as {
      ids: string[], action: 'delete'|'update', data?: any
    }
    
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    if (action === 'delete') {
      await prisma.support.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ ok: true, count: ids.length })
    }

    if (action === 'update') {
      // Limpia campos no permitidos
          // Cambio de código para un único ítem
    if (data?.__codeSingle) {
      if (ids.length !== 1) return NextResponse.json({ error: 'Código: seleccione solo 1 elemento' }, { status: 400 })
      try {
        await prisma.support.update({ where: { id: ids[0] }, data: { code: String(data.__codeSingle).trim() } })
        return NextResponse.json({ ok: true, count: 1 })
      } catch (e) {
        return NextResponse.json({ error: 'Código duplicado o inválido' }, { status: 409 })
      }
    }

    const allowed = ['status','owner','type','title','priceMonth'] // 👈 añadidos: title, type
    const patch: Record<string, any> = {}
    for (const k of allowed) if (k in (data||{})) patch[k] = data[k]
    
    // Sincroniza available con status si llega
    if ('status' in patch) {
      patch.available = patch.status === 'DISPONIBLE'
    }
    
    const res = await prisma.support.updateMany({
      where: { id: { in: ids } },
      data: patch
    })
    return NextResponse.json({ ok: true, count: res.count })
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
