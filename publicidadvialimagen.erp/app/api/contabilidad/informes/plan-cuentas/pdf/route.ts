export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"

async function cargarLogo(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg")
    const logoBuffer = await fs.readFile(logoPath)
    return `data:image/jpeg;base64,${logoBuffer.toString("base64")}`
  } catch (error) {
    console.error("Error cargando logo:", error)
    return null
  }
}

function dibujarPiePagina(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  footerHeight: number,
  primaryColor: [number, number, number],
  currentYear: number
) {
  const totalPages = pdf.getNumberOfPages()
  const footerY = pageHeight - footerHeight
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, footerY, pageWidth, footerHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    const footerTextY = footerY + footerHeight / 2 + 2
    pdf.text(`${currentYear} Publicidad Vial Imagen`, 5, footerTextY)
    pdf.text("|", 65, footerTextY)
    pdf.text("contabilidad@publicidadvialimagen.com", 70, footerTextY)
    const webW = pdf.getTextWidth("contabilidad@publicidadvialimagen.com")
    pdf.text("|", 70 + webW + 5, footerTextY)
    pdf.text("NIT: 164692025", 70 + webW + 10, footerTextY)
    const nitW = pdf.getTextWidth("NIT: 164692025")
    pdf.text("|", 70 + webW + 10 + nitW + 5, footerTextY)
    pdf.text(`${i}/${totalPages}`, pageWidth - 15, footerTextY, { align: "right" })
  }
}

async function dibujarEncabezado(pdf: jsPDF, pageWidth: number): number {
  let yPosition = 10
  const logoBase64 = await cargarLogo()
  if (logoBase64) {
    const aspectRatio = 24 / 5.5
    const maxHeight = 10
    const calculatedWidth = maxHeight * aspectRatio
    const logoWidth = Math.min(calculatedWidth, 45)
    const logoHeight = logoWidth / aspectRatio
    pdf.addImage(logoBase64, "JPEG", 15, yPosition, logoWidth, logoHeight)
  }
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.text("Publicidad Vial Imagen S.R.L.", pageWidth - 15, yPosition + 1, { align: "right" })
  pdf.setFont("helvetica", "normal")
  pdf.text("C. Nicolás Acosta Esq. Pedro Blanco", pageWidth - 15, yPosition + 5, { align: "right" })
  pdf.text("(Alto San Pedro) N° 1471", pageWidth - 15, yPosition + 9, { align: "right" })
  pdf.text("La Paz", pageWidth - 15, yPosition + 13, { align: "right" })
  return 30
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const clasificador = searchParams.get("clasificador")
    const desde_cuenta = searchParams.get("desde_cuenta")
    const hasta_cuenta = searchParams.get("hasta_cuenta")
    const aitb = searchParams.get("aitb")
    const transaccional = searchParams.get("transaccional")
    const nivel = searchParams.get("nivel")
    const tipo_cuenta = searchParams.get("tipo_cuenta")

    let query = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta, cuenta_padre, aitb, transaccional")
      .eq("empresa_id", 1)
      .order("cuenta", { ascending: true })

    if (clasificador) query = query.eq("clasificador", clasificador)
    if (desde_cuenta) query = query.gte("cuenta", desde_cuenta)
    if (hasta_cuenta) query = query.lte("cuenta", hasta_cuenta)
    if (aitb === "true") query = query.eq("aitb", true)
    if (aitb === "false") query = query.eq("aitb", false)
    if (transaccional === "true") query = query.eq("transaccional", true)
    if (transaccional === "false") query = query.eq("transaccional", false)
    if (nivel) query = query.eq("nivel", parseInt(nivel, 10))
    if (tipo_cuenta) query = query.eq("tipo_cuenta", tipo_cuenta)

    const { data, error } = await query

    if (error) {
      if (
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation")
      ) {
        return NextResponse.json(
          { error: "No hay datos para exportar con los filtros seleccionados" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Error al obtener el plan de cuentas", details: error.message },
        { status: 500 }
      )
    }

    const rows = (data || []).map((c: any) => ({
      cuenta: c.cuenta,
      descripcion: c.descripcion || "",
      nivel: c.nivel,
      tipo: c.tipo_cuenta || "-",
      aitb: !!c.aitb,
      transaccional: !!c.transaccional,
    }))

    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const primaryColor: [number, number, number] = [190, 8, 18]
    const currentYear = new Date().getFullYear()
    const footerHeight = 12
    const maxY = pageHeight - footerHeight - 15

    let yPosition = await dibujarEncabezado(pdf, pageWidth)

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const titulo = "PLAN DE CUENTAS"
    const tituloWidth = pdf.getTextWidth(titulo)
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition)
    yPosition += 10

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Total de cuentas: ${rows.length}`, margin, yPosition)
    yPosition += 8

    const tableWidth = pageWidth - 2 * margin
    const colWidths = [28, 72, 14, 28, 14, 20]
    const headerHeight = 8
    const headers = ["Cuenta", "Descripción", "Nivel", "Tipo", "AITB", "Trans."]

    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.setFillColor(240, 240, 240)
    pdf.setDrawColor(200, 200, 200)
    pdf.setTextColor(0, 0, 0)
    let headerY = yPosition - 5
    pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
    let xPos = margin
    colWidths.forEach((w) => {
      pdf.line(xPos, headerY, xPos, headerY + headerHeight)
      xPos += w
    })
    pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
    xPos = margin
    headers.forEach((h, i) => {
      pdf.text(h, xPos + (i === 1 ? 2 : colWidths[i] / 2), yPosition, {
        align: i === 1 ? "left" : "center",
      })
      xPos += colWidths[i]
    })
    yPosition += 8
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setDrawColor(200, 200, 200)

    for (const r of rows) {
      if (yPosition > maxY) {
        pdf.addPage()
        yPosition = 20
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "bold")
        pdf.setFillColor(240, 240, 240)
        headerY = yPosition - 5
        pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
        xPos = margin
        colWidths.forEach((w) => {
          pdf.line(xPos, headerY, xPos, headerY + headerHeight)
          xPos += w
        })
        pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
        xPos = margin
        headers.forEach((h, i) => {
          pdf.text(h, xPos + (i === 1 ? 2 : colWidths[i] / 2), yPosition, {
            align: i === 1 ? "left" : "center",
          })
          xPos += colWidths[i]
        })
        yPosition += 8
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(7)
      }
      xPos = margin
      pdf.text((r.cuenta || "").slice(0, 14), xPos + 2, yPosition, { maxWidth: colWidths[0] - 2 })
      xPos += colWidths[0]
      pdf.text((r.descripcion || "").slice(0, 42), xPos + 2, yPosition, { maxWidth: colWidths[1] - 2 })
      xPos += colWidths[1]
      pdf.text(String(r.nivel ?? ""), xPos + colWidths[2] / 2, yPosition, { align: "center" })
      xPos += colWidths[2]
      pdf.text((r.tipo || "-").slice(0, 10), xPos + colWidths[3] / 2, yPosition, { align: "center" })
      xPos += colWidths[3]
      pdf.text(r.aitb ? "Sí" : "No", xPos + colWidths[4] / 2, yPosition, { align: "center" })
      xPos += colWidths[4]
      pdf.text(r.transaccional ? "Sí" : "No", xPos + colWidths[5] / 2, yPosition, { align: "center" })
      yPosition += 5
    }

    dibujarPiePagina(pdf, pageWidth, pageHeight, footerHeight, primaryColor, currentYear)

    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, "0")
    const mes = String(hoy.getMonth() + 1).padStart(2, "0")
    const año = hoy.getFullYear()
    const nombreArchivo = `plan_cuentas_${dia}-${mes}-${año}.pdf`

    const buffer = Buffer.from(pdf.output("arraybuffer"))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/plan-cuentas/pdf:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
