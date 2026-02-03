export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"
import { getDataLibroAuxiliares } from "../getData"

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

/** Pie de página igual que balance de sumas y saldos / libro diario */
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

/** Encabezado común: logo (izquierda) + empresa (derecha), mismo que balance y libro diario */
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
    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""

    const { data, tipo_reporte } = await getDataLibroAuxiliares(supabase, searchParams)

    const isEmpty =
      tipo_reporte === "Resumen"
        ? !Array.isArray(data) || data.length === 0
        : !(data as any)?.auxiliares?.length
    if (isEmpty) {
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

    // Título centrado (estilo balance / libro diario)
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const titulo = tipo_reporte === "Resumen" ? "LIBRO DE AUXILIARES - RESUMEN" : "LIBRO DE AUXILIARES - DETALLE"
    const tituloWidth = pdf.getTextWidth(titulo)
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition)
    yPosition += 10

    // Información de filtros (mismo estilo que balance y libro diario)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    let infoY = yPosition
    if (fecha_inicial && fecha_final) {
      const fi = new Date(fecha_inicial).toLocaleDateString("es-ES")
      const ff = new Date(fecha_final).toLocaleDateString("es-ES")
      pdf.text(`Período: ${fi} al ${ff}`, margin, infoY)
      infoY += 5
    }
    pdf.text(`Moneda: ${moneda === "USD" ? "USD" : "Bs"}`, margin, infoY)
    infoY += 5
    pdf.text(`Tipo de reporte: ${tipo_reporte}`, margin, infoY)
    yPosition = infoY + 8

    const tableWidth = pageWidth - 2 * margin
    const headerHeight = 8

    if (tipo_reporte === "Resumen") {
      // ---------- Estilo Balance de Sumas y Saldos ----------
      const colWidths = [42, 16, 50, 18, 18, 18, 18]
      const colHeaders = ["Auxiliar", "Cuenta", "Descripción", "S.Inic.", "Debe", "Haber", "S.Final"]
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(240, 240, 240)
      pdf.setDrawColor(200, 200, 200)
      pdf.setTextColor(0, 0, 0)
      const headerY = yPosition - 5
      pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
      let xPos = margin
      colWidths.forEach((w) => {
        pdf.line(xPos, headerY, xPos, headerY + headerHeight)
        xPos += w
      })
      pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
      xPos = margin
      colHeaders.forEach((h, i) => {
        pdf.text(h + (i >= 3 ? ` (${monedaSufijo})` : ""), xPos + colWidths[i] / 2, yPosition, { align: "center" })
        xPos += colWidths[i]
      })
      yPosition += 8
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      let tableStartY = yPosition - 3
      let tableEndY = yPosition - 3

      for (const row of data as any[]) {
        if (yPosition > 250) {
          pdf.line(margin, tableStartY, margin, tableEndY)
          pdf.line(margin + tableWidth, tableStartY, margin + tableWidth, tableEndY)
          pdf.addPage()
          yPosition = 20
          pdf.setFontSize(8)
          pdf.setFont("helvetica", "bold")
          pdf.setFillColor(240, 240, 240)
          pdf.setDrawColor(200, 200, 200)
          const hY = yPosition - 5
          pdf.rect(margin, hY, tableWidth, headerHeight, "FD")
          xPos = margin
          colWidths.forEach((w) => {
            pdf.line(xPos, hY, xPos, hY + headerHeight)
            xPos += w
          })
          pdf.line(margin + tableWidth, hY, margin + tableWidth, hY + headerHeight)
          xPos = margin
          colHeaders.forEach((h, i) => {
            pdf.text(h + (i >= 3 ? ` (${monedaSufijo})` : ""), xPos + colWidths[i] / 2, yPosition, { align: "center" })
            xPos += colWidths[i]
          })
          yPosition += 8
          pdf.setFontSize(7)
          pdf.setFont("helvetica", "normal")
          tableStartY = yPosition - 3
          tableEndY = yPosition - 3
        }
        const auxText =
          row.auxiliar_codigo != null
            ? `${row.auxiliar_codigo} - ${row.auxiliar_nombre ?? ""}`
            : (row.auxiliar_nombre ?? "-")
        const desc = (row.descripcion_cuenta || "").slice(0, 32)
        xPos = margin
        pdf.text(auxText.slice(0, 28), xPos + 2, yPosition, { maxWidth: colWidths[0] - 2 })
        xPos += colWidths[0]
        pdf.text(row.cuenta || "", xPos + 2, yPosition, { maxWidth: colWidths[1] - 2 })
        xPos += colWidths[1]
        pdf.text(desc, xPos + 2, yPosition, { maxWidth: colWidths[2] - 2 })
        xPos += colWidths[2]
        pdf.text(formatearNumero(row.saldo_inicial ?? 0), xPos + colWidths[3] / 2, yPosition, { align: "center" })
        xPos += colWidths[3]
        pdf.text(formatearNumero(row.total_debe ?? 0), xPos + colWidths[4] / 2, yPosition, { align: "center" })
        xPos += colWidths[4]
        pdf.text(formatearNumero(row.total_haber ?? 0), xPos + colWidths[5] / 2, yPosition, { align: "center" })
        xPos += colWidths[5]
        pdf.text(formatearNumero(row.saldo_final ?? 0), xPos + colWidths[6] / 2, yPosition, { align: "center" })
        tableEndY = yPosition + 2
        yPosition += 6
      }
      pdf.line(margin, tableStartY, margin, tableEndY)
      pdf.line(margin + tableWidth, tableStartY, margin + tableWidth, tableEndY)
    } else {
      // ---------- Estilo Libro Diario (secciones por auxiliar/cuenta) ----------
      const widths = [20, 18, 18, 76, 14, 14, 16]
      const headers = [
        "Fecha",
        "Nº Comp.",
        "Tipo comp.",
        "Glosa / Concepto",
        `Debe (${monedaSufijo})`,
        `Haber (${monedaSufijo})`,
        `Saldo (${monedaSufijo})`,
      ]
      const auxiliares = (data as { auxiliares: any[] }).auxiliares
      for (const aux of auxiliares) {
        const auxLabel =
          aux.auxiliar_codigo != null ? `${aux.auxiliar_codigo} - ${aux.auxiliar_nombre ?? ""}` : (aux.auxiliar_nombre ?? "-")
        if (yPosition > maxY - 25) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.setFillColor(245, 245, 245)
        pdf.setDrawColor(200, 200, 200)
        const compHeaderHeight = 8
        pdf.rect(margin, yPosition - 5, tableWidth, compHeaderHeight, "FD")
        pdf.rect(margin, yPosition - 5, tableWidth, compHeaderHeight, "D")
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(0, 0, 0)
        pdf.text(`Auxiliar: ${auxLabel}`, margin + 2, yPosition)
        yPosition += 8

        for (const cta of aux.cuentas) {
          if (yPosition > maxY - 20) {
            pdf.addPage()
            yPosition = 20
          }
          const cuentaLabel = `Cuenta: ${cta.cuenta} — ${(cta.descripcion_cuenta || "").slice(0, 35)}`
          pdf.setFillColor(245, 245, 245)
          pdf.setDrawColor(200, 200, 200)
          const cuentaHeaderHeight = 8
          pdf.rect(margin, yPosition - 5, tableWidth, cuentaHeaderHeight, "FD")
          pdf.rect(margin, yPosition - 5, tableWidth, cuentaHeaderHeight, "D")
          pdf.setFontSize(8)
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(0, 0, 0)
          pdf.text(cuentaLabel, margin + 2, yPosition)
          yPosition += 8

          const headerY = yPosition - 4
          pdf.setFontSize(7)
          pdf.setFont("helvetica", "bold")
          pdf.setFillColor(240, 240, 240)
          pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
          let x = margin
          widths.forEach((w, i) => {
            pdf.line(x, headerY, x, headerY + headerHeight)
            x += w
          })
          pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
          x = margin
          widths.forEach((w, i) => {
            pdf.text(headers[i], x + (i >= 4 ? w / 2 : 2), yPosition, { align: i >= 4 ? "center" : "left" })
            x += w
          })
          yPosition += headerHeight
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(6)
          pdf.setDrawColor(200, 200, 200)

          for (const mov of cta.movimientos) {
            if (yPosition > maxY) {
              pdf.addPage()
              yPosition = 20
              pdf.setFont("helvetica", "bold")
              pdf.setFontSize(7)
              pdf.rect(margin, yPosition - 4, tableWidth, headerHeight, "FD")
              x = margin
              widths.forEach((w, i) => {
                pdf.line(x, yPosition - 4, x, yPosition - 4 + headerHeight)
                x += w
              })
              pdf.line(margin + tableWidth, yPosition - 4, margin + tableWidth, yPosition - 4 + headerHeight)
              x = margin
              widths.forEach((w, i) => {
                pdf.text(headers[i], x + (i >= 4 ? w / 2 : 2), yPosition, { align: i >= 4 ? "center" : "left" })
                x += w
              })
              yPosition += headerHeight
              pdf.setFont("helvetica", "normal")
              pdf.setFontSize(6)
            }
            const esSaldoInicial = !!(mov as any).es_saldo_inicial
            const fechaStr = mov.fecha ? new Date(mov.fecha).toLocaleDateString("es-ES") : (esSaldoInicial ? "" : "-")
            const glosa = (mov.glosa || "").slice(0, 38)
            const rowH = 5
            if (esSaldoInicial) pdf.setFont("helvetica", "italic")
            x = margin
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[0]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[1]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[2]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[3]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[4]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[5]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x += widths[6]
            pdf.line(x, yPosition - 3, x, yPosition - 3 + rowH)
            x = margin
            pdf.text(fechaStr, x + 2, yPosition, { maxWidth: widths[0] - 2 })
            x += widths[0]
            pdf.text(esSaldoInicial ? "" : String(mov.numero_comprobante ?? "-").slice(0, 8), x + 2, yPosition, { maxWidth: widths[1] - 2 })
            x += widths[1]
            pdf.text(esSaldoInicial ? "" : (mov.tipo_comprobante || "-").slice(0, 10), x + 2, yPosition, { maxWidth: widths[2] - 2 })
            x += widths[2]
            pdf.text(glosa, x + 2, yPosition, { maxWidth: widths[3] - 2 })
            x += widths[3]
            pdf.text(esSaldoInicial ? "0,00" : (mov.debe !== 0 ? formatearNumero(mov.debe) : "-"), x + widths[4] / 2, yPosition, { align: "center" })
            x += widths[4]
            pdf.text(esSaldoInicial ? "0,00" : (mov.haber !== 0 ? formatearNumero(mov.haber) : "-"), x + widths[5] / 2, yPosition, { align: "center" })
            x += widths[5]
            pdf.text(formatearNumero(mov.saldo ?? 0), x + widths[6] / 2, yPosition, { align: "center" })
            if (esSaldoInicial) pdf.setFont("helvetica", "normal")
            yPosition += rowH
          }
          if (yPosition > maxY) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.setFillColor(245, 245, 245)
          pdf.rect(margin, yPosition - 3, tableWidth, 6, "F")
          pdf.setDrawColor(200, 200, 200)
          pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(6)
          const xRightText = margin + widths[0] + widths[1] + widths[2] + widths[3] - 2
          pdf.text("TOTALES CUENTA", xRightText, yPosition, { align: "right" })
          let xTot = margin + widths[0] + widths[1] + widths[2] + widths[3]
          pdf.text(formatearNumero(cta.total_debe ?? 0), xTot + widths[4] / 2, yPosition, { align: "center" })
          xTot += widths[4]
          pdf.text(formatearNumero(cta.total_haber ?? 0), xTot + widths[5] / 2, yPosition, { align: "center" })
          xTot += widths[5]
          pdf.text(formatearNumero(cta.saldo_final ?? 0), xTot + widths[6] / 2, yPosition, { align: "center" })
          yPosition += 6
        }
        if (yPosition > maxY - 10) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin, yPosition - 3, tableWidth, 6, "F")
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(6)
        const xRightAux = margin + widths[0] + widths[1] + widths[2] + widths[3] - 2
        pdf.text("TOTAL AUXILIAR", xRightAux, yPosition, { align: "right" })
        let xAux = margin + widths[0] + widths[1] + widths[2] + widths[3]
        pdf.text(formatearNumero(aux.total_debe ?? 0), xAux + widths[4] / 2, yPosition, { align: "center" })
        xAux += widths[4]
        pdf.text(formatearNumero(aux.total_haber ?? 0), xAux + widths[5] / 2, yPosition, { align: "center" })
        xAux += widths[5]
        pdf.text(formatearNumero(aux.total_saldo ?? 0), xAux + widths[6] / 2, yPosition, { align: "center" })
        yPosition += 10
      }

      const totalGeneral = (data as { total_general?: { total_debe: number; total_haber: number; total_saldo: number } }).total_general
      if (totalGeneral) {
        if (yPosition > maxY - 12) {
          pdf.addPage()
          yPosition = 20
        }
        yPosition += 4
        pdf.setFillColor(229, 229, 229)
        pdf.rect(margin, yPosition - 3, tableWidth, 8, "F")
        pdf.setDrawColor(150, 150, 150)
        pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(7)
        const xRightGen = margin + widths[0] + widths[1] + widths[2] + widths[3] - 2
        pdf.text("TOTAL GENERAL", xRightGen, yPosition, { align: "right" })
        let xGen = margin + widths[0] + widths[1] + widths[2] + widths[3]
        pdf.text(formatearNumero(totalGeneral.total_debe ?? 0), xGen + widths[4] / 2, yPosition, { align: "center" })
        xGen += widths[4]
        pdf.text(formatearNumero(totalGeneral.total_haber ?? 0), xGen + widths[5] / 2, yPosition, { align: "center" })
        xGen += widths[5]
        pdf.text(formatearNumero(totalGeneral.total_saldo ?? 0), xGen + widths[6] / 2, yPosition, { align: "center" })
        yPosition += 12
      }
    }

    dibujarPiePagina(pdf, pageWidth, pageHeight, footerHeight, primaryColor, currentYear)

    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, "0")
    const mes = String(hoy.getMonth() + 1).padStart(2, "0")
    const año = hoy.getFullYear()
    const nombreArchivo = `libro_auxiliares_${dia}-${mes}-${año}.pdf`

    const buffer = Buffer.from(pdf.output("arraybuffer"))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-auxiliares/pdf:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
