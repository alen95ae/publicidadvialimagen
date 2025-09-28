import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const rows = parse(buf.toString('utf8'), { columns: true, skip_empty_lines: true })

    let created = 0, updated = 0
    for (const r of rows) {
      // columnas esperadas (case-insensitive): code,title,type,widthM,heightM,city,country,priceMonth,status,owner,impactosDiarios,googleMapsLink
      const code = String(r.code || r.CODE || '').trim()
      if (!code) continue
      
      const data: any = {
        code,
        title: r.title ?? r.TITLE,
        type: r.type ?? r.TYPE,
        widthM: r.widthM ? Number(r.widthM) : undefined,
        heightM: r.heightM ? Number(r.heightM) : undefined,
        city: r.city, 
        country: r.country,
        priceMonth: r.priceMonth ? Number(r.priceMonth) : undefined,
        status: r.status,
        owner: r.owner,
        impactosDiarios: r.impactosDiarios ? Number(r.impactosDiarios) : undefined,
        googleMapsLink: r.googleMapsLink,
      }

      const exist = await prisma.support.findUnique({ where: { code } })
      if (exist) { 
        await prisma.support.update({ where: { code }, data })
        updated++ 
      } else { 
        await prisma.support.create({ data })
        created++ 
      }
    }

    return NextResponse.json({ ok: true, created, updated })
  } catch (error) {
    console.error("Error importing CSV:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
