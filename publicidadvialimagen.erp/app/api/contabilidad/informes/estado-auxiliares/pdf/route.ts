export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"
import { formatDateBolivia } from "@/lib/utils"
import { getDataEstadoAuxiliares } from "../getData"
import type { EstadoAuxiliaresFila } from "../getData"

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

function formatearNumero(numero: number): string {
  const n = Number(numero)
  const s = n.toFixed(2)
  const [parteEntera, parteDecimal] = s.split(".")
  const conMiles = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${conMiles},${parteDecimal}`
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
  pdf.text("Publicidad Vial Imagen S.R.L.", pageWidth - 15, yPosition + 1, {
    align: "right",
  })
  pdf.setFont("helvetica", "normal")
  pdf.text(
    "C. Nicolás Acosta Esq. Pedro Blanco",
    pageWidth - 15,
    yPosition + 5,
    { align: "right" }
  )
  pdf.text("(Alto San Pedro) N° 1471", pageWidth - 15, yPosition + 9, {
    align: "right",
  })
  pdf.text("La Paz", pageWidth - 15, yPosition + 13, { align: "right" })
  return 30
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""
    if (!fecha_inicial || !fecha_final) {
      return NextResponse.json(
        { error: "Los parámetros fecha_inicial y fecha_final son obligatorios" },
        { status: 400 }
      )
    }

    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = searchParams.get("moneda_simbolo") || moneda
    const monedaNombre = searchParams.get("moneda_nombre") || moneda

    const supabase = getSupabaseAdmin()
    const data = await getDataEstadoAuxiliares(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      clasificador: searchParams.get("clasificador") || "",
      desde_cuenta: searchParams.get("desde_cuenta") || "",
      hasta_cuenta: searchParams.get("hasta_cuenta") || "",
      desde_auxiliar: searchParams.get("desde_auxiliar") || "",
      hasta_auxiliar: searchParams.get("hasta_auxiliar") || "",
      fecha_inicial,
      fecha_final,
      estado: searchParams.get("estado") || "Aprobado",
      moneda,
    })

    if (!data.resultados?.length) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

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
    const titulo = "ESTADO DE AUXILIARES"
    const tituloWidth = pdf.getTextWidth(titulo)
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition)
    yPosition += 10

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(
      `Período: ${formatDateBolivia(fecha_inicial)} al ${formatDateBolivia(fecha_final)}`,
      margin,
      yPosition
    )
    yPosition += 5
    pdf.text(`Moneda: ${monedaNombre}`, margin, yPosition)
    yPosition += 8

    const tableWidth = pageWidth - 2 * margin
    const colWidths = [22, 22, 48, 22, 22, 22, 26]
    const headerHeight = 8
    const colHeaders = [
      "Auxiliar",
      "Cuenta",
      "Descripción",
      `S.Ant. (${monedaSufijo})`,
      `Debe (${monedaSufijo})`,
      `Haber (${monedaSufijo})`,
      `S.Act. (${monedaSufijo})`,
    ]

    function dibujarFilaEncabezado(y: number) {
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(240, 240, 240)
      pdf.setDrawColor(200, 200, 200)
      const headerY = y - 5
      pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
      let xPos = margin
      colWidths.forEach((w) => {
        pdf.line(xPos, headerY, xPos, headerY + headerHeight)
        xPos += w
      })
      pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
      xPos = margin
      colHeaders.forEach((h, i) => {
        pdf.text(h, xPos + (i <= 2 ? 2 : colWidths[i] / 2), y, {
          align: i <= 2 ? "left" : "center",
        })
        xPos += colWidths[i]
      })
    }

    dibujarFilaEncabezado(yPosition)
    yPosition += 8
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setDrawColor(200, 200, 200)

    const rowHeight = 6
    for (const r of data.resultados as EstadoAuxiliaresFila[]) {
      if (yPosition > maxY) {
        pdf.addPage()
        yPosition = 20
        dibujarFilaEncabezado(yPosition)
        yPosition += 8
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(7)
      }
      const rowTop = yPosition - 3
      const rowBottom = rowTop + rowHeight
      pdf.setDrawColor(200, 200, 200)
      let xPos = margin
      colWidths.forEach((w) => {
        pdf.line(xPos, rowTop, xPos, rowBottom)
        xPos += w
      })
      pdf.line(margin + tableWidth, rowTop, margin + tableWidth, rowBottom)

      const auxText = (r.auxiliar_codigo ?? r.auxiliar_nombre).slice(0, 20)
      const desc = (r.cuenta_descripcion || "").slice(0, 35)
      xPos = margin
      pdf.text(auxText, xPos + 2, yPosition, { maxWidth: colWidths[0] - 2 })
      xPos += colWidths[0]
      pdf.text(r.cuenta_codigo || "", xPos + 2, yPosition, { maxWidth: colWidths[1] - 2 })
      xPos += colWidths[1]
      pdf.text(desc, xPos + 2, yPosition, { maxWidth: colWidths[2] - 2 })
      xPos += colWidths[2]
      pdf.text(formatearNumero(r.saldo_anterior), xPos + colWidths[3] / 2, yPosition, { align: "center" })
      xPos += colWidths[3]
      pdf.text(formatearNumero(r.total_debe), xPos + colWidths[4] / 2, yPosition, { align: "center" })
      xPos += colWidths[4]
      pdf.text(formatearNumero(r.total_haber), xPos + colWidths[5] / 2, yPosition, { align: "center" })
      xPos += colWidths[5]
      pdf.text(formatearNumero(r.saldo_actual), xPos + colWidths[6] / 2, yPosition, { align: "center" })
      yPosition += rowHeight
    }

    if (yPosition > maxY - 14) {
      pdf.addPage()
      yPosition = 20
    }
    yPosition += 6
    const totalSaldoAnt = data.resultados.reduce((s, r) => s + r.saldo_anterior, 0)
    const totalDebe = data.resultados.reduce((s, r) => s + r.total_debe, 0)
    const totalHaber = data.resultados.reduce((s, r) => s + r.total_haber, 0)
    const totalSaldoAct = data.resultados.reduce((s, r) => s + r.saldo_actual, 0)
    const rowTop = yPosition - 3
    const rowH = 8
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(margin, rowTop, tableWidth, rowH, "F")
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, rowTop, margin + tableWidth, rowTop)
    pdf.line(margin, rowTop + rowH, margin + tableWidth, rowTop + rowH)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    const textY = rowTop + rowH / 2 + (8 * 0.17)
    pdf.text("TOTALES", margin + 4, textY, { align: "left" })
    let xTot = margin + colWidths[0] + colWidths[1] + colWidths[2]
    pdf.text(formatearNumero(totalSaldoAnt), xTot + colWidths[3] / 2, textY, { align: "center" })
    xTot += colWidths[3]
    pdf.text(formatearNumero(totalDebe), xTot + colWidths[4] / 2, textY, { align: "center" })
    xTot += colWidths[4]
    pdf.text(formatearNumero(totalHaber), xTot + colWidths[5] / 2, textY, { align: "center" })
    xTot += colWidths[5]
    pdf.text(formatearNumero(totalSaldoAct), xTot + colWidths[6] / 2, textY, { align: "center" })

    dibujarPiePagina(pdf, pageWidth, pageHeight, footerHeight, primaryColor, currentYear)

    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, "0")
    const mes = String(hoy.getMonth() + 1).padStart(2, "0")
    const año = hoy.getFullYear()
    const nombreArchivo = `estado_auxiliares_${dia}-${mes}-${año}.pdf`

    const buffer = Buffer.from(pdf.output("arraybuffer"))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error(
      "Error in GET /api/contabilidad/informes/estado-auxiliares/pdf:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
