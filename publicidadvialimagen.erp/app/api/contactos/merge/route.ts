export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { mergeContactos, updateContacto } from "@/lib/supabaseContactos";

export async function POST(req: Request) {
  try {
    const { mainId, duplicates, mergedFields } = await req.json();

    if (!mainId || !Array.isArray(duplicates) || duplicates.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos: mainId o duplicates" },
        { status: 400 }
      );
    }

    console.log(`🔄 Fusionando contactos: ${mainId} con ${duplicates.length} duplicados`)

    // 1) Actualizar contacto principal con datos fusionados
    if (mergedFields && Object.keys(mergedFields).length > 0) {
      const cleanFields = Object.fromEntries(
        Object.entries(mergedFields).filter(([_, v]) => v !== undefined)
      );
      
      await updateContacto(mainId, cleanFields);
      console.log(`✅ Contacto principal actualizado:`, mainId)
    }

    // 2) Eliminar duplicados (fusionar los duplicados en el principal)
    const result = await mergeContactos(mainId, duplicates);

    if (!result) {
      throw new Error("Error al fusionar contactos")
    }

    console.log(`✅ Contactos fusionados exitosamente`)

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("💥 Error en merge de contactos:", e);
    return NextResponse.json(
      { error: e.message || "Error interno en merge" },
      { status: 500 }
    );
  }
}
