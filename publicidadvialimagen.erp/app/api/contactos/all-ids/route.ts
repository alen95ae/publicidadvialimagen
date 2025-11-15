export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllContactos } from "@/lib/supabaseContactos"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const relationFilter = searchParams.get('relation') || ''
    const kindFilter = searchParams.get('kind') || ''

    console.log('🔍 Getting all contact IDs with filters:', { query, relationFilter, kindFilter })

    // Obtener todos los contactos con filtros
    const contactos = await getAllContactos({
      query,
      relation: relationFilter,
      kind: kindFilter
    })

    // Ordenamiento personalizado: números primero, luego letras A-Z, sin nombre al final
    contactos.sort((a, b) => {
      const nameA = a.displayName || ''
      const nameB = b.displayName || ''

      // Si uno está vacío y el otro no, el vacío va al final
      if (!nameA && nameB) return 1
      if (nameA && !nameB) return -1
      if (!nameA && !nameB) return 0

      const firstCharA = nameA.charAt(0)
      const firstCharB = nameB.charAt(0)
      const isNumberA = /\d/.test(firstCharA)
      const isNumberB = /\d/.test(firstCharB)

      // Números antes que letras
      if (isNumberA && !isNumberB) return -1
      if (!isNumberA && isNumberB) return 1

      // Ambos del mismo tipo, ordenar alfabéticamente
      return nameA.localeCompare(nameB, 'es', { numeric: true, sensitivity: 'base' })
    })

    const ids = contactos.map(c => c.id)

    console.log(`✅ Obtenidos ${ids.length} IDs de contactos`)

    return NextResponse.json({ ids, total: ids.length })
  } catch (e: any) {
    console.error("❌ Error obteniendo IDs de contactos:", e)
    return NextResponse.json({ error: "No se pudieron obtener los IDs" }, { status: 500 })
  }
}
