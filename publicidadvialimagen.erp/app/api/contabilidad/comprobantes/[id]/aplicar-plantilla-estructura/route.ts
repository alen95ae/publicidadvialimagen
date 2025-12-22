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

    // Cargar configuración de cuentas IVA
    const { data: configIVA } = await supabase
      .from("contabilidad_config")
      .select("key, value")
      .in("key", ["IVA_CREDITO_CUENTA", "IVA_DEBITO_CUENTA"])

    const configMap: Record<string, string> = {}
    configIVA?.forEach((item) => {
      configMap[item.key] = item.value
    })

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

    // Cuentas por defecto según rol (OBLIGATORIO: cuenta es NOT NULL)
    // IMPORTANTE: IVA_CREDITO debe usar la cuenta exacta 116001001 (no 116001)
    const cuentasPorDefectoPorRol: Record<string, string> = {
      GASTO: "600",           // Cuenta de gastos genérica (editable)
      INGRESO: "500",         // Cuenta de ingresos genérica (editable)
      IVA_CREDITO: configMap["IVA_CREDITO_CUENTA"] || "116001001",  // Fija, no editable
      IVA_DEBITO: configMap["IVA_DEBITO_CUENTA"] || "213001001",    // Fija, no editable
      PROVEEDOR: "400",       // Cuentas por pagar (editable)
      CLIENTE: "700",         // Cuentas por cobrar (editable)
      CAJA_BANCO: "110",      // Disponibilidades (editable)
    }

    detallesPlantilla.forEach((detPlantilla, index) => {
      let cuentaResuelta: string

      // 1. Si tiene cuenta_fija configurada en la plantilla, usar esa
      if (detPlantilla.cuenta_fija) {
        cuentaResuelta = detPlantilla.cuenta_fija
      }
      // 2. Si es IVA, usar la cuenta de configuración
      else if (detPlantilla.rol === "IVA_CREDITO" && configMap["IVA_CREDITO_CUENTA"]) {
        cuentaResuelta = configMap["IVA_CREDITO_CUENTA"]
      } else if (detPlantilla.rol === "IVA_DEBITO" && configMap["IVA_DEBITO_CUENTA"]) {
        cuentaResuelta = configMap["IVA_DEBITO_CUENTA"]
      }
      // 3. Usar cuenta por defecto según rol
      else if (cuentasPorDefectoPorRol[detPlantilla.rol]) {
        cuentaResuelta = cuentasPorDefectoPorRol[detPlantilla.rol]
      }
      // 4. Fallback general (no debería llegar aquí)
      else {
        cuentaResuelta = "100" // Cuenta genérica de activo
      }

      console.log(`📝 Línea ${index + 1}: Rol=${detPlantilla.rol}, Cuenta=${cuentaResuelta}`)

      detallesData.push({
        comprobante_id: resolvedParams.id,
        cuenta: cuentaResuelta,  // ✅ NUNCA NULL
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

    console.log("✅ Detalles insertados correctamente:", detallesInsertados.length)

    // Devolver detalles con información de la plantilla para el frontend
    const detallesConPlantilla = detallesInsertados.map((det, index) => ({
      ...det,
      rol: detallesPlantilla[index].rol,
      lado: detallesPlantilla[index].lado,
      porcentaje: detallesPlantilla[index].porcentaje,
      permite_seleccionar_cuenta: detallesPlantilla[index].permite_seleccionar_cuenta,
      permite_auxiliar: detallesPlantilla[index].permite_auxiliar,
    }))

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

