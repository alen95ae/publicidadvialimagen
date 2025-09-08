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

  return {
    ...data,
    status,
    areaM2,
    productionCost,
    available: mapAvailableFromStatus(status), // compatibilidad con el booleano existente
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const statuses = (searchParams.get('status') || '')
      .split(',').map(s => s.trim()).filter(Boolean)
    
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
    
    const supports = await prisma.support.findMany({
      where,
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(supports)
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
      }
    })
    
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
