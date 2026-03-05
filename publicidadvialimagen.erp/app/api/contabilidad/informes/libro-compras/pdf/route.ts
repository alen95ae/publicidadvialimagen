export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"
import { getDataLibroCompras } from "../getData"
import type { LibroComprasFila, LibroComprasTotales } from "../getData"

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

function formatFecha(fecha: string): string {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  if (Number.isNaN(d.getTime())) return fecha
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
    const periodo_mes = searchParams.get("periodo_mes") || ""
    const periodo_anio = searchParams.get("periodo_anio") || ""
    if (!periodo_mes || !periodo_anio) {
      return NextResponse.json(
        { error: "Los parámetros periodo_mes y periodo_anio son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataLibroCompras(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      periodo_mes,
      periodo_anio,
      tipo_reporte: searchParams.get("tipo_reporte") || "Impuestos",
    })

    if (!result.data?.length) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const pdf = new jsPDF("l", "mm", "a4")
    const pageWidth = 297
    const pageHeight = 210
    const margin = 12
    const primaryColor: [number, number, number] = [190, 8, 18]
    const currentYear = new Date().getFullYear()
    const footerHeight = 12
    const maxY = pageHeight - footerHeight - 12

    let yPosition = await dibujarEncabezado(pdf, pageWidth)

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const titulo = "LIBRO DE COMPRAS I.V.A."
    const tituloWidth = pdf.getTextWidth(titulo)
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition)
    yPosition += 6
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Período: ${periodo_anio}-${periodo_mes}`, margin, yPosition)
    yPosition += 8

    const tableWidth = pageWidth - 2 * margin
    const colWidths = [8, 16, 19, 32, 19, 24, 19, 19, 19, 17, 15, 21, 21]
    const headerHeight = 7
    const colHeaders = [
      "Nro",
      "Fecha",
      "NIT",
      "Razón Social",
      "Nro Fact.",
      "Nro Aut.",
      "Cód.Control",
      "Imp.Total",
      "No CF",
      "Subtotal",
      "Desc.",
      "Base CF",
      "Créd.Fiscal",
    ]

    function dibujarFilaEncabezado(y: number) {
      pdf.setFontSize(6)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(240, 240, 240)
      pdf.setDrawColor(200, 200, 200)
      const headerY = y - 4
      pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
      let xPos = margin
      colWidths.forEach((w) => {
        pdf.line(xPos, headerY, xPos, headerY + headerHeight)
        xPos += w
      })
      pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
      xPos = margin
      colHeaders.forEach((h, i) => {
        const isCenter = i >= 2
        pdf.text(h, xPos + (isCenter ? colWidths[i] / 2 : 1), y, {
          align: isCenter ? "center" : "left",
        })
        xPos += colWidths[i]
      })
    }

    dibujarFilaEncabezado(yPosition)
    yPosition += 7
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6)
    pdf.setDrawColor(200, 200, 200)

    const rowHeight = 5
    for (let idx = 0; idx < result.data.length; idx++) {
      const r = result.data[idx] as LibroComprasFila
      if (yPosition > maxY) {
        pdf.addPage("l", "a4")
        yPosition = 18
        dibujarFilaEncabezado(yPosition)
        yPosition += 7
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(6)
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

      const proveedor = (r.proveedor || "").slice(0, 28)
      xPos = margin
      pdf.text(String(idx + 1), xPos + colWidths[0] / 2, yPosition, { align: "center" })
      xPos += colWidths[0]
      pdf.text(formatFecha(r.fecha), xPos + 1, yPosition, { maxWidth: colWidths[1] - 1 })
      xPos += colWidths[1]
      pdf.text((r.nit || "").slice(0, 14), xPos + colWidths[2] / 2, yPosition, { align: "center" })
      xPos += colWidths[2]
      pdf.text(proveedor, xPos + colWidths[3] / 2, yPosition, { align: "center" })
      xPos += colWidths[3]
      pdf.text((r.nro_factura || "").slice(0, 12), xPos + 1, yPosition, { maxWidth: colWidths[4] - 1 })
      xPos += colWidths[4]
      pdf.text((r.nro_autorizacion || "").slice(0, 14), xPos + colWidths[5] / 2, yPosition, { align: "center" })
      xPos += colWidths[5]
      pdf.text((r.codigo_control || "").slice(0, 12), xPos + colWidths[6] / 2, yPosition, { align: "center" })
      xPos += colWidths[6]
      pdf.text(formatearNumero(r.importe_total), xPos + colWidths[7] / 2, yPosition, { align: "center" })
      xPos += colWidths[7]
      pdf.text(formatearNumero(r.importe_no_sujeto_cf), xPos + colWidths[8] / 2, yPosition, { align: "center" })
      xPos += colWidths[8]
      pdf.text(formatearNumero(r.subtotal), xPos + colWidths[9] / 2, yPosition, { align: "center" })
      xPos += colWidths[9]
      pdf.text(formatearNumero(r.descuentos), xPos + colWidths[10] / 2, yPosition, { align: "center" })
      xPos += colWidths[10]
      pdf.text(formatearNumero(r.base_credito_fiscal), xPos + colWidths[11] / 2, yPosition, { align: "center" })
      xPos += colWidths[11]
      pdf.text(formatearNumero(r.credito_fiscal), xPos + colWidths[12] / 2, yPosition, { align: "center" })
      yPosition += rowHeight
    }

    if (yPosition > maxY - 10) {
      pdf.addPage("l", "a4")
      yPosition = 18
    }
    yPosition += 4
    const t: LibroComprasTotales = result.totales
    const rowTop = yPosition - 3
    const rowH = 7
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(margin, rowTop, tableWidth, rowH, "F")
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, rowTop, margin + tableWidth, rowTop)
    pdf.line(margin, rowTop + rowH, margin + tableWidth, rowTop + rowH)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6)
    const textY = rowTop + rowH / 2 + (6 * 0.17)
    let xTot = margin
    pdf.text("TOTALES", xTot + 2, textY, { align: "left" })
    xTot += colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6]
    pdf.text(formatearNumero(t.importe_total), xTot + colWidths[7] / 2, textY, { align: "center" })
    xTot += colWidths[7]
    pdf.text(formatearNumero(t.importe_no_sujeto_cf), xTot + colWidths[8] / 2, textY, { align: "center" })
    xTot += colWidths[8]
    pdf.text(formatearNumero(t.subtotal), xTot + colWidths[9] / 2, textY, { align: "center" })
    xTot += colWidths[9]
    pdf.text(formatearNumero(t.descuentos), xTot + colWidths[10] / 2, textY, { align: "center" })
    xTot += colWidths[10]
    pdf.text(formatearNumero(t.base_credito_fiscal), xTot + colWidths[11] / 2, textY, { align: "center" })
    xTot += colWidths[11]
    pdf.text(formatearNumero(t.credito_fiscal), xTot + colWidths[12] / 2, textY, { align: "center" })

    dibujarPiePagina(pdf, pageWidth, pageHeight, footerHeight, primaryColor, currentYear)

    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, "0")
    const mes = String(hoy.getMonth() + 1).padStart(2, "0")
    const año = hoy.getFullYear()
    const nombreArchivo = `libro_compras_iva_${dia}-${mes}-${año}.pdf`

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
      "Error in GET /api/contabilidad/informes/libro-compras/pdf:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
