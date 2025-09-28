import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Funciones de normalización y cálculo
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const statuses = (searchParams.get('status') || '')
      .split(',').map(s => s.trim()).filter(Boolean)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit
    
    const where: any = {
      AND: [
        statuses.length ? { status: { in: statuses as any } } : {},
        {
          OR: [
            { code: { contains: q } },
            { title: { contains: q } },
            { type: { contains: q } },
            { city: { contains: q } },
            { owner: { contains: q } },
          ]
        }
      ]
    }
    
    if (!q && !statuses.length) {
      delete where.AND
      where.OR = [
        { code: { contains: '' } },
        { title: { contains: '' } },
        { type: { contains: '' } },
        { city: { contains: '' } },
        { owner: { contains: '' } },
      ]
    }
    
    // Obtener total de registros
    const total = await prisma.support.count({ where })
    
    // Obtener registros paginados
    const supports = await prisma.support.findMany({
      where,
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
    
    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    // Deserializar el campo images para cada soporte
    const supportsWithImages = supports.map(support => ({
      ...support,
      images: support.images ? JSON.parse(support.images) : []
    }))

    const result = {
      data: supportsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching supports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validación básica
    if (!data.code || !data.title) {
      return NextResponse.json(
        { error: "Código y título son requeridos" },
        { status: 400 }
      )
    }
    
    const payload = await normalizeSupportInput(data)
    
    const created = await prisma.support.create({ 
      data: {
        ...payload,
        priceMonth: payload.priceMonth ? parseFloat(payload.priceMonth) : null,
        widthM: payload.widthM ? parseFloat(payload.widthM) : null,
        heightM: payload.heightM ? parseFloat(payload.heightM) : null,
        latitude: payload.latitude ? parseFloat(payload.latitude) : null,
        longitude: payload.longitude ? parseFloat(payload.longitude) : null,
        pricePerM2: payload.pricePerM2 ? parseFloat(payload.pricePerM2) : null,
        areaM2: payload.areaM2 ? parseFloat(payload.areaM2) : null,
        productionCost: payload.productionCost ? parseFloat(payload.productionCost) : null,
        impactosDiarios: payload.impactosDiarios ? parseInt(payload.impactosDiarios) : null,
        googleMapsLink: payload.googleMapsLink || null,
        iluminacion: payload.iluminacion,
        images: payload.images ? JSON.stringify(payload.images) : null,
      }
    })
    
    // Deserializar el campo images antes de devolver
    const createdWithImages = {
      ...created,
      images: created.images ? JSON.parse(created.images) : []
    }
    
    return NextResponse.json(createdWithImages, { status: 201 })
  } catch (error) {
    console.error("Error creating support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
