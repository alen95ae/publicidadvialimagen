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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await prisma.support.findUnique({ 
      where: { id },
      include: {
        company: {
          select: { name: true }
        }
      }
    })
    
    if (!item) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }
    
    // Deserializar el campo images
    const itemWithImages = {
      ...item,
      images: item.images ? JSON.parse(item.images) : []
    }
    
    return NextResponse.json(itemWithImages)
  } catch (error) {
    console.error("Error fetching support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    
    // Validación básica
    if (!data.code || !data.title) {
      return NextResponse.json(
        { error: "Código y título son requeridos" },
        { status: 400 }
      )
    }
    
    // Leer el soporte existente para normalización
    const existing = await prisma.support.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }
    
    const payload = await normalizeSupportInput(data, existing)
    
    const updated = await prisma.support.update({ 
      where: { id }, 
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
        // Campos que no necesitan conversión
        googleMapsLink: payload.googleMapsLink || null,
        iluminacion: payload.iluminacion,
        images: payload.images ? JSON.stringify(payload.images) : null,
      }
    })
    
    // Deserializar el campo images antes de devolver
    const updatedWithImages = {
      ...updated,
      images: updated.images ? JSON.parse(updated.images) : []
    }
    
    return NextResponse.json(updatedWithImages)
  } catch (error) {
    console.error("Error updating support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.support.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
