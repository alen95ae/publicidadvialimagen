export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

interface AplicarPlantillaEstructuraBody {
  plantilla_codigo: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()
    const body: AplicarPlantillaEstructuraBody = await request.json()
    
    // Await params (Next.js 15 requirement)
    const resolvedParams = await params

    // Validaciones básicas
    if (!body.plantilla_codigo) {
      return NextResponse.json(
        { error: "plantilla_codigo es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el comprobante existe y está en BORRADOR
    const { data: comprobante, error: errorComprobante } = await supabase
      .from("comprobantes")
      .select("*")
      .eq("id", resolvedParams.id)
      .single()

    if (errorComprobante || !comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    if (comprobante.estado !== "BORRADOR") {
      return NextResponse.json(
        { error: "Solo se pueden aplicar plantillas a comprobantes en estado BORRADOR" },
        { status: 400 }
      )
    }

    // Cargar plantilla
    const { data: plantilla, error: errorPlantilla } = await supabase
      .from("plantillas_contables")
      .select("*")
      .eq("codigo", body.plantilla_codigo)
      .eq("activa", true)
      .single()

    if (errorPlantilla || !plantilla) {
      return NextResponse.json(
        { error: "Plantilla no encontrada o inactiva" },
        { status: 404 }
      )
    }

    // Cargar detalles de la plantilla ordenados
    const { data: detallesPlantilla, error: errorDetallesPlantilla } = await supabase
      .from("plantillas_contables_detalle")
      .select("*")
      .eq("plantilla_id", plantilla.id)
      .order("orden", { ascending: true })

    if (errorDetallesPlantilla || !detallesPlantilla || detallesPlantilla.length === 0) {
      return NextResponse.json(
        { error: "La plantilla no tiene detalles configurados" },
        { status: 400 }
      )
    }

    // Cargar códigos de cuentas para las líneas con cuenta_id
    const cuentasMap = new Map<number, string>()
    const cuentasIds = detallesPlantilla
      .filter(d => d.cuenta_id)
      .map(d => d.cuenta_id)
    
    if (cuentasIds.length > 0) {
      const { data: cuentasData } = await supabase
        .from("plan_cuentas")
        .select("id, cuenta")
        .in("id", cuentasIds)
      
      if (cuentasData) {
        cuentasData.forEach(c => cuentasMap.set(c.id, c.cuenta))
      }
    }

    // Eliminar detalles existentes del comprobante
    const { error: errorEliminar } = await supabase
      .from("comprobante_detalle")
      .delete()
      .eq("comprobante_id", resolvedParams.id)

    if (errorEliminar) {
      return NextResponse.json(
        { error: "Error al eliminar detalles existentes", details: errorEliminar.message },
        { status: 500 }
      )
    }

    // Construir líneas de comprobante_detalle con estructura (montos en 0)
    const detallesData: any[] = []

    // Si cuenta_es_fija === true Y tiene cuenta_id, cargar el código de cuenta
    detallesPlantilla.forEach((detPlantilla, index) => {
      const cuentaEsFija = detPlantilla.cuenta_es_fija === true
      let codigoCuenta = ""
      
      // Si es fija y tiene cuenta_id, buscar el código
      if (cuentaEsFija && detPlantilla.cuenta_id) {
        codigoCuenta = cuentasMap.get(detPlantilla.cuenta_id) || ""
      }

      detallesData.push({
        comprobante_id: resolvedParams.id,
        cuenta: codigoCuenta,
        auxiliar: null,
        glosa: null,
        debe_bs: 0,
        haber_bs: 0,
        debe_usd: 0,
        haber_usd: 0,
        orden: index + 1,
      })
    })

    console.log("📊 Total líneas a insertar:", detallesData.length)
    console.log("📋 Detalles a insertar:", JSON.stringify(detallesData, null, 2))

    // Insertar detalles
    const { data: detallesInsertados, error: errorInsertar } = await supabase
      .from("comprobante_detalle")
      .insert(detallesData)
      .select()

    if (errorInsertar) {
      console.error("❌ Error al insertar detalles:", {
        message: errorInsertar.message,
        code: errorInsertar.code,
        details: errorInsertar.details,
        hint: errorInsertar.hint,
      })
      return NextResponse.json(
        { 
          error: "Error al insertar detalles", 
          details: errorInsertar.message,
          code: errorInsertar.code,
          payload: detallesData
        },
        { status: 500 }
      )
    }


    // Devolver detalles con información de la plantilla para el frontend
    const detallesConPlantilla = detallesInsertados.map((det, index) => {
      const detPlantilla = detallesPlantilla[index]
      const codigoCuenta = detPlantilla.cuenta_id ? cuentasMap.get(detPlantilla.cuenta_id) || "" : ""
      
      return {
        ...det,
        lado: detPlantilla.lado,
        porcentaje: detPlantilla.porcentaje,
        bloqueado: detPlantilla.bloqueado === true,
        cuenta_es_fija: detPlantilla.cuenta_es_fija === true,
        permite_auxiliar: detPlantilla.permite_auxiliar === true,
        // Enviar el código de cuenta como referencia
        cuenta_sugerida: codigoCuenta,
      }
    })

    // 🧠 LOG DE DIAGNÓSTICO: Verificar qué se está enviando al frontend
    console.log("🧠 BACKEND aplicar-plantilla-estructura RESULT", {
      plantilla_codigo: body.plantilla_codigo,
      total_detalles: detallesConPlantilla.length,
      detalles: detallesConPlantilla.map(d => ({
        cuenta: d.cuenta,
        cuenta_sugerida: d.cuenta_sugerida,
        porcentaje: d.porcentaje,
        lado: d.lado,
        bloqueado: d.bloqueado,
        cuenta_es_fija: d.cuenta_es_fija,
        permite_auxiliar: d.permite_auxiliar
      }))
    })

    return NextResponse.json({
      success: true,
      data: {
        detalles: detallesConPlantilla,
        plantilla: {
          codigo: plantilla.codigo,
          nombre: plantilla.nombre,
        },
      },
    })
  } catch (error: any) {
    console.error("Error aplicando estructura de plantilla:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

