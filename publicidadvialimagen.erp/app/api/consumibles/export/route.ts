import { NextRequest, NextResponse } from "next/server";
import { getAllConsumibles } from "@/lib/supabaseConsumibles";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || "";
    const categoria = searchParams.get("categoria") || "";
    const q = (searchParams.get("q") || "").trim();

    let consumibles = await getAllConsumibles();

    if (idsParam.trim()) {
      const idSet = new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean));
      consumibles = consumibles.filter((c) => idSet.has(c.id));
    } else {
      if (categoria) {
        consumibles = consumibles.filter((c) => (c.categoria || "").trim() === categoria);
      }
      if (q) {
        const nq = q.toLowerCase();
        consumibles = consumibles.filter(
          (c) =>
            (c.codigo || "").toLowerCase().includes(nq) ||
            (c.nombre || "").toLowerCase().includes(nq) ||
            (c.categoria || "").toLowerCase().includes(nq)
        );
      }
    }

    const excelData = consumibles.map((c) => ({
      "Código": c.codigo ?? "",
      "Nombre": c.nombre ?? "",
      "Categoría": c.categoria ?? "",
      "Unidad": c.unidad_medida ?? "",
      "Coste": c.coste ?? 0,
      "Stock": c.stock ?? 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Consumibles");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fecha = new Date().toISOString().split("T")[0];
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="consumibles_${fecha}.xlsx"`,
      },
    });
  } catch (e: any) {
    console.error("❌ Error export consumibles:", e);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}
