import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

// Funciones de normalización y cálculo (copiadas de route.ts)
function toNum(n: any) { const x = Number(n); return isFinite(x) ? x : 0 }
function calcArea(widthM?: any, heightM?: any) {
  return +(toNum(widthM) * toNum(heightM)).toFixed(2)
}
function calcProductionCost(areaM2: number, pricePerM2?: any) {
  return +(areaM2 * toNum(pricePerM2)).toFixed(2)
}
function mapAvailableFromStatus(status?: string) {
  return status === 'DISPONIBLE'
}

async function normalizeSupportInput(data: any, existing?: any) {
  const widthM  = data.widthM ?? existing?.widthM
  const heightM = data.heightM ?? existing?.heightM
  const areaM2  = calcArea(widthM, heightM)

  const status = (data.status ?? existing?.status ?? 'DISPONIBLE') as any

  // Calcula coste si NO está en override
  let productionCost = data.productionCost
  const override = Boolean(data.productionCostOverride ?? existing?.productionCostOverride)
  if (!override) {
    productionCost = calcProductionCost(areaM2, data.pricePerM2 ?? existing?.pricePerM2)
  }

  // Filtrar solo campos válidos del esquema de Prisma
  const validFields = {
    code: data.code,
    title: data.title,
    type: data.type,
    widthM: data.widthM,
    heightM: data.heightM,
    city: data.city,
    country: data.country,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    priceMonth: data.priceMonth,
    pricePerM2: data.pricePerM2,
    owner: data.owner,
    imageUrl: data.imageUrl,
    productionCostOverride: data.productionCostOverride,
    // Campos adicionales que faltaban
    googleMapsLink: data.googleMapsLink,
    iluminacion: data.iluminacion,
    impactosDiarios: data.impactosDiarios,
    images: data.images,
    // Campos calculados
    status,
    areaM2,
    productionCost,
    available: mapAvailableFromStatus(status),
  }

  // Filtrar campos undefined
  return Object.fromEntries(
    Object.entries(validFields).filter(([_, value]) => value !== undefined)
  )
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const rows = parse(buf.toString('utf8'), { columns: true, skip_empty_lines: true })

    let created = 0, updated = 0
    for (const r of rows) {
      try {
        // Mapear columnas en español a inglés
        const code = String(r.Codigo || r.codigo || r.CODIGO || '').trim()
        if (!code) continue
        
        // Mapear disponibilidad a estados del sistema
        const mapDisponibilidad = (disp: string) => {
          const d = String(disp || '').toLowerCase()
          if (d.includes('disponible')) return 'DISPONIBLE'
          if (d.includes('reservado')) return 'RESERVADO'
          if (d.includes('ocupado')) return 'OCUPADO'
          if (d.includes('no disponible')) return 'NO_DISPONIBLE'
          return 'DISPONIBLE'
        }
        
        const rawData: any = {
          code,
          title: r.Titulo || r.titulo || r.TITULO || '',
          type: r.Tipo || r.tipo || r.TIPO || '',
          widthM: r.Ancho && !isNaN(Number(r.Ancho)) ? Number(r.Ancho) : undefined,
          heightM: r.Alto && !isNaN(Number(r.Alto)) ? Number(r.Alto) : undefined,
          city: r.Ciudad || r.ciudad || r.CIUDAD || '', 
          country: 'Bolivia', // Por defecto
          priceMonth: (r['Precio por mes'] || r['Precio_por_mes'] || r.precio_mes) && !isNaN(Number(r['Precio por mes'] || r['Precio_por_mes'] || r.precio_mes)) ? Number(r['Precio por mes'] || r['Precio_por_mes'] || r.precio_mes) : undefined,
          status: mapDisponibilidad(r.Disponibilidad || r.disponibilidad || r.DISPONIBILIDAD),
          impactosDiarios: (r['Impactos diarios'] || r['Impactos_diarios'] || r.impactos_diarios) && !isNaN(Number(r['Impactos diarios'] || r['Impactos_diarios'] || r.impactos_diarios)) ? Number(r['Impactos diarios'] || r['Impactos_diarios'] || r.impactos_diarios) : undefined,
          googleMapsLink: r.Ubicación || r.ubicación || r.UBICACION || '',
          images: [],
        }

        const exist = await prisma.support.findUnique({ where: { code } })
        
        // Preparar datos directamente sin normalización por ahora
        const prismaData: any = {
          code: rawData.code,
          title: rawData.title || 'Sin título',
          type: rawData.type || 'Sin tipo',
          widthM: rawData.widthM || null,
          heightM: rawData.heightM || null,
          city: rawData.city || null,
          country: rawData.country || null,
          address: rawData.address || null,
          latitude: rawData.latitude || null,
          longitude: rawData.longitude || null,
          priceMonth: rawData.priceMonth || null,
          pricePerM2: rawData.pricePerM2 || null,
          status: rawData.status || 'DISPONIBLE',
          owner: rawData.owner || null,
          impactosDiarios: rawData.impactosDiarios || null,
          googleMapsLink: rawData.googleMapsLink || null,
          iluminacion: rawData.iluminacion,
          images: rawData.images && rawData.images.length > 0 ? JSON.stringify(rawData.images) : null,
          available: (rawData.status || 'DISPONIBLE') === 'DISPONIBLE',
          areaM2: rawData.widthM && rawData.heightM ? rawData.widthM * rawData.heightM : null,
          productionCost: null,
          productionCostOverride: false,
        }

        if (exist) { 
          await prisma.support.update({ where: { code }, data: prismaData })
          updated++ 
        } else { 
          await prisma.support.create({ data: prismaData })
          created++ 
        }
      } catch (rowError) {
        console.error(`Error processing row with code ${r.code}:`, rowError)
        console.error('Row data:', r)
        // Continuar con la siguiente fila en caso de error
        continue
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
