export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import type { Auxiliar } from "@/lib/types/contabilidad"

function mapTipoAuxiliarToRelacion(tipo: string): "Cliente" | "Proveedor" | "Ambos" {
  const t = (tipo || "").toLowerCase().trim()
  if (t === "proveedor") return "Proveedor"
  if (t === "cliente" || t === "gobierno") return "Cliente"
  return "Ambos"
}

// GET - Obtener un auxiliar por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener auxiliar directamente desde la tabla
    // Intentar primero con user, si falla usar admin
    let { data, error } = await supabase
      .from("auxiliares")
      .select("*")
      .eq("id", params.id)
      .single()

    // DEBUG: Log temporal
    console.log("🔍 [GET /auxiliares/[id]] ID buscado:", params.id)
    console.log("🔍 [GET /auxiliares/[id]] Intento con user - Registro encontrado:", data ? "Sí" : "No")
    if (error) {
      console.log("🔍 [GET /auxiliares/[id]] Error con user:", error.message)
    }

    // Si no hay datos, intentar con admin
    if (!data && error) {
      console.log("⚠️ [GET /auxiliares/[id]] Intentando con admin...")
      const supabaseAdmin = getSupabaseAdmin()
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("auxiliares")
        .select("*")
        .eq("id", params.id)
        .single()
      
      if (!adminError && adminData) {
        console.log("✅ [GET /auxiliares/[id]] Admin encontró el registro")
        data = adminData
        error = null
      }
    }

    if (data) {
      console.log("🔍 [GET /auxiliares/[id]] Datos:", JSON.stringify(data, null, 2))
    }

    if (error) {
      console.error("❌ [GET /auxiliares/[id]] Error fetching auxiliar:", error)
      return NextResponse.json(
        { error: "Error al obtener el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Auxiliar no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in GET /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un auxiliar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>

    const { data: actual } = await supabase
      .from("auxiliares")
      .select("contact_id, tipo_auxiliar, nombre, ciudad, direccion, telefono, email, nit, es_cuenta_bancaria")
      .eq("id", params.id)
      .maybeSingle()

    // Preparar datos para actualización (nombres de columna en BD: cuenta_id, es_cuenta_bancaria, vigente)
    const updateData: Record<string, unknown> = {}
    if (body.tipo_auxiliar !== undefined) updateData.tipo_auxiliar = body.tipo_auxiliar
    if (body.codigo !== undefined) updateData.codigo = body.codigo
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id
    if (body.cuenta_id !== undefined) updateData.cuenta_id = body.cuenta_id
    if (body.moneda !== undefined) updateData.moneda = body.moneda
    if (body.es_cuenta_bancaria !== undefined) updateData.es_cuenta_bancaria = body.es_cuenta_bancaria
    if (body.ciudad !== undefined) updateData.ciudad = body.ciudad
    if (body.direccion !== undefined) updateData.direccion = body.direccion
    if (body.telefono !== undefined) updateData.telefono = body.telefono
    if (body.email !== undefined) updateData.email = body.email
    if (body.nit !== undefined) updateData.nit = body.nit
    if (body.autorizacion !== undefined) updateData.autorizacion = body.autorizacion
    if (body.vigente !== undefined) updateData.vigente = body.vigente

    const tipoFinal = String(body.tipo_auxiliar ?? (actual as any)?.tipo_auxiliar ?? "").trim()
    const nombreFinal = String(body.nombre ?? (actual as any)?.nombre ?? "").trim()
    const isBankFinal = Boolean(
      body.es_cuenta_bancaria !== undefined
        ? body.es_cuenta_bancaria
        : (actual as any)?.es_cuenta_bancaria
    )

    let contactIdFinal = (body.contact_id ?? (actual as any)?.contact_id ?? null) as string | null
    if (isBankFinal) {
      contactIdFinal = null
    } else if (tipoFinal && nombreFinal) {
      const supabaseAdmin = getSupabaseAdmin()
      const contactoPayload = {
        nombre: nombreFinal,
        relacion: mapTipoAuxiliarToRelacion(tipoFinal),
        ciudad: (body.ciudad ?? (actual as any)?.ciudad ?? null) as string | null,
        direccion: (body.direccion ?? (actual as any)?.direccion ?? null) as string | null,
        telefono: (body.telefono ?? (actual as any)?.telefono ?? null) as string | null,
        email: (body.email ?? (actual as any)?.email ?? null) as string | null,
        nit: (body.nit ?? (actual as any)?.nit ?? null) as string | null,
        fecha_actualizacion: new Date().toISOString(),
      }

      if (contactIdFinal) {
        const { data: updatedContacto, error: updateContactoError } = await supabaseAdmin
          .from("contactos")
          .update(contactoPayload)
          .eq("id", contactIdFinal)
          .select("id")
          .single()
        if (updateContactoError || !updatedContacto?.id) {
          const { data: createdContacto, error: createContactoError } = await supabaseAdmin
            .from("contactos")
            .insert({
              ...contactoPayload,
              tipo_contacto: "Individual",
              fecha_creacion: new Date().toISOString(),
            })
            .select("id")
            .single()
          if (createContactoError) {
            return NextResponse.json(
              { error: `Error al sincronizar contacto: ${createContactoError.message}` },
              { status: 500 }
            )
          }
          contactIdFinal = (createdContacto?.id || null) as string | null
        }
      } else {
        const { data: createdContacto, error: createContactoError } = await supabaseAdmin
          .from("contactos")
          .insert({
            ...contactoPayload,
            tipo_contacto: "Individual",
            fecha_creacion: new Date().toISOString(),
          })
          .select("id")
          .single()
        if (createContactoError) {
          return NextResponse.json(
            { error: `Error al sincronizar contacto: ${createContactoError.message}` },
            { status: 500 }
          )
        }
        contactIdFinal = (createdContacto?.id || null) as string | null
      }
    }
    updateData.contact_id = contactIdFinal

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("auxiliares")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating auxiliar:", error)
      return NextResponse.json(
        { error: "Error al actualizar el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Auxiliar no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Auxiliar actualizado correctamente",
    })
  } catch (error) {
    console.error("Error in PUT /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un auxiliar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "eliminar")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase
      .from("auxiliares")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting auxiliar:", error)
      return NextResponse.json(
        { error: "Error al eliminar el auxiliar", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Auxiliar eliminado correctamente",
    })
  } catch (error) {
    console.error("Error in DELETE /api/contabilidad/auxiliares/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}







