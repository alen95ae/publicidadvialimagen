import { NextResponse } from "next/server";

const API = "https://api.airtable.com/v0";
const baseId = process.env.AIRTABLE_BASE_ID!;
const token = process.env.AIRTABLE_API_KEY!;
const TABLE = process.env.AIRTABLE_TABLE_CONTACTOS || "Contactos";

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function POST(req: Request) {
  try {
    const { mainId, duplicates, mergedFields } = await req.json();

    if (!mainId || !Array.isArray(duplicates) || duplicates.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos: mainId o duplicates" },
        { status: 400 }
      );
    }

    // ✅ Limpieza de campos undefined
    const cleanFields = Object.fromEntries(
      Object.entries(mergedFields || {}).filter(([_, v]) => v !== undefined)
    );

    // ✅ 1) Actualizar contacto principal con datos fusionados
    const updateUrl = `${API}/${baseId}/${encodeURIComponent(TABLE)}/${mainId}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ fields: cleanFields }),
      cache: "no-store",
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("❌ Error al actualizar contacto principal:", text);
      throw new Error(`Fallo en PATCH (${updateRes.status})`);
    }

    // ✅ 2) Eliminar duplicados restantes
    for (const dupId of duplicates) {
      if (dupId && dupId !== mainId) {
        const deleteUrl = `${API}/${baseId}/${encodeURIComponent(TABLE)}/${dupId}`;
        const delRes = await fetch(deleteUrl, {
          method: "DELETE",
          headers: headers(),
          cache: "no-store",
        });
        if (!delRes.ok) {
          const errText = await delRes.text();
          console.warn("⚠️ Error eliminando duplicado:", dupId, errText);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("💥 Error en merge de contactos:", e);
    return NextResponse.json(
      { error: e.message || "Error interno en merge" },
      { status: 500 }
    );
  }
}


