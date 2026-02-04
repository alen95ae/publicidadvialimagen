export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"
import { getDataBalanceGeneral } from "../getData"

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

    const { searchParams } = new URL(request.url)
    const a_fecha = searchParams.get("a_fecha") || ""
    if (!a_fecha) {
      return NextResponse.json(
        { error: "El parámetro a_fecha es obligatorio" },
        { status: 400 }
      )
    }

    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    const supabase = getSupabaseAdmin()
    const data = await getDataBalanceGeneral(supabase, {
      a_fecha,
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      moneda,
      estado: searchParams.get("estado") || "Aprobado",
    })

    const tieneDatos =
      data.activo.length > 0 || data.pasivo.length > 0 || data.patrimonio.length > 0
    if (!tieneDatos) {
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
    const titulo = "BALANCE GENERAL"
    const tituloWidth = pdf.getTextWidth(titulo)
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition)
    yPosition += 10

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`A fecha: ${new Date(a_fecha).toLocaleDateString("es-ES")}`, margin, yPosition)
    yPosition += 5
    pdf.text(`Moneda: ${moneda === "USD" ? "USD" : "Bs"}`, margin, yPosition)
    yPosition += 8

    const tableWidth = pageWidth - 2 * margin
    const colWidths = [35, 100, 45]
    const headerHeight = 8
    const headers = ["Cuenta", "Descripción", `Saldo (${monedaSufijo})`]

    function dibujarSeccion(
      tituloSeccion: string,
      filas: { cuenta: string; descripcion: string; saldo: number }[],
      total: number
    ): void {
      if (yPosition > maxY - 25) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      pdf.text(tituloSeccion, margin, yPosition)
      yPosition += 7

      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(240, 240, 240)
      pdf.setDrawColor(200, 200, 200)
      const headerY = yPosition - 5
      pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
      let xPos = margin
      colWidths.forEach((w) => {
        pdf.line(xPos, headerY, xPos, headerY + headerHeight)
        xPos += w
      })
      pdf.line(margin + tableWidth, headerY, margin + tableWidth, headerY + headerHeight)
      xPos = margin
      headers.forEach((h, i) => {
        pdf.text(h, xPos + (i < 2 ? 2 : colWidths[i] / 2), yPosition, {
          align: i < 2 ? "left" : "center",
        })
        xPos += colWidths[i]
      })
      yPosition += 8
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.setDrawColor(200, 200, 200)

      for (const r of filas) {
        if (yPosition > maxY) {
          pdf.addPage()
          yPosition = 20
          pdf.setFontSize(8)
          pdf.setFont("helvetica", "bold")
          pdf.setFillColor(240, 240, 240)
          const hY = yPosition - 5
          pdf.rect(margin, hY, tableWidth, headerHeight, "FD")
          xPos = margin
          colWidths.forEach((w) => {
            pdf.line(xPos, hY, xPos, hY + headerHeight)
            xPos += w
          })
          pdf.line(margin + tableWidth, hY, margin + tableWidth, hY + headerHeight)
          xPos = margin
          headers.forEach((h, i) => {
            pdf.text(h, xPos + (i < 2 ? 2 : colWidths[i] / 2), yPosition, {
              align: i < 2 ? "left" : "center",
            })
            xPos += colWidths[i]
          })
          yPosition += 8
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(7)
        }
        xPos = margin
        pdf.text((r.cuenta || "").slice(0, 18), xPos + 2, yPosition, { maxWidth: colWidths[0] - 2 })
        xPos += colWidths[0]
        pdf.text((r.descripcion || "").slice(0, 55), xPos + 2, yPosition, { maxWidth: colWidths[1] - 2 })
        xPos += colWidths[1]
        pdf.text(formatearNumero(r.saldo), xPos + colWidths[2] / 2, yPosition, { align: "center" })
        yPosition += 5
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
      pdf.setFontSize(7)
      const xRight = margin + colWidths[0] + colWidths[1] - 2
      pdf.text(`Total ${tituloSeccion}`, xRight, yPosition, { align: "right" })
      pdf.text(formatearNumero(total), margin + colWidths[0] + colWidths[1] + colWidths[2] / 2, yPosition, {
        align: "center",
      })
      yPosition += 10
    }

    dibujarSeccion("ACTIVO", data.activo, data.totales.total_activo)
    dibujarSeccion("PASIVO", data.pasivo, data.totales.total_pasivo)
    dibujarSeccion("PATRIMONIO", data.patrimonio, data.totales.total_patrimonio)

    if (yPosition > maxY - 14) {
      pdf.addPage()
      yPosition = 20
    }
    yPosition += 4
    pdf.setFillColor(229, 229, 229)
    pdf.rect(margin, yPosition - 3, tableWidth, 8, "F")
    pdf.setDrawColor(150, 150, 150)
    pdf.line(margin, yPosition - 3, margin + tableWidth, yPosition - 3)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    const xRightGen = margin + colWidths[0] + colWidths[1] - 2
    pdf.text("TOTAL GENERAL", xRightGen, yPosition, { align: "right" })
    pdf.text(
      formatearNumero(data.totales.total_activo),
      margin + colWidths[0] + colWidths[1] + colWidths[2] / 2,
      yPosition,
      { align: "center" }
    )

    dibujarPiePagina(pdf, pageWidth, pageHeight, footerHeight, primaryColor, currentYear)

    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, "0")
    const mes = String(hoy.getMonth() + 1).padStart(2, "0")
    const año = hoy.getFullYear()
    const nombreArchivo = `balance_general_${dia}-${mes}-${año}.pdf`

    const buffer = Buffer.from(pdf.output("arraybuffer"))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/balance-general/pdf:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
