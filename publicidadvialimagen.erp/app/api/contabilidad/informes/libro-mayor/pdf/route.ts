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

function formatearNumero(numero: number): string {
  const n = Number(numero)
  const numeroFormateado = n.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split(".")
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${parteEnteraConSeparador},${parteDecimal}`
}

/**
 * GET - Generar PDF Libro Mayor
 * Misma lógica que GET libro-mayor: comprobantes APROBADOS por defecto,
 * comprobantes + comprobante_detalle + plan_cuentas, saldo acumulado.
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get("empresa_id") || ""
    const clasificador = searchParams.get("clasificador") || ""
    const desde_cuenta = searchParams.get("desde_cuenta") || ""
    const hasta_cuenta = searchParams.get("hasta_cuenta") || ""
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""
    const estadoParam = searchParams.get("estado") || "Aprobado"
    const moneda = searchParams.get("moneda") || "BOB"
    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id, numero, fecha, tipo_asiento, concepto, estado")

    if (empresa_id && empresa_id !== "todos") {
      comprobantesQuery = comprobantesQuery.eq("empresa_id", empresa_id)
    }

    const estadoFiltro =
      estadoParam && estadoParam !== "Todos" ? estadoParam.toUpperCase() : "APROBADO"
    comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro)
    if (fecha_inicial) comprobantesQuery = comprobantesQuery.gte("fecha", fecha_inicial)
    if (fecha_final) comprobantesQuery = comprobantesQuery.lte("fecha", fecha_final)

    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError || !comprobantes || comprobantes.length === 0) {
      return NextResponse.json(
        { error: "No hay comprobantes para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const comprobanteIds = comprobantes.map((c: any) => c.id)
    let detallesQuery = supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
      .in("comprobante_id", comprobanteIds)
    if (desde_cuenta) detallesQuery = detallesQuery.gte("cuenta", desde_cuenta)
    if (hasta_cuenta) detallesQuery = detallesQuery.lte("cuenta", hasta_cuenta)

    const { data: detalles, error: detallesError } = await detallesQuery

    if (detallesError || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: "No hay movimientos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const cuentaCodes = [...new Set(detalles.map((d: any) => d.cuenta))]
    let cuentasMap: Record<string, string> = {}
    let cuentaTipoMap: Record<string, string> = {}

    if (cuentaCodes.length > 0) {
      const { data: cuentas } = await supabase
        .from("plan_cuentas")
        .select("cuenta, descripcion, tipo_cuenta")
        .in("cuenta", cuentaCodes)
      if (cuentas) {
        cuentas.forEach((c: any) => {
          cuentasMap[c.cuenta] = c.descripcion || ""
          cuentaTipoMap[c.cuenta] = c.tipo_cuenta || ""
        })
      }
    }

    const comprobantesMap = comprobantes.reduce((acc: Record<number, any>, comp: any) => {
      acc[comp.id] = comp
      return acc
    }, {})

    let movimientos = detalles
      .map((det: any) => {
        const comprobante = comprobantesMap[det.comprobante_id]
        if (!comprobante) return null
        const debe = moneda === "USD" ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
        const haber = moneda === "USD" ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
        return {
          cuenta: det.cuenta,
          descripcion_cuenta: cuentasMap[det.cuenta] || "",
          tipo_cuenta: cuentaTipoMap[det.cuenta] || "",
          fecha: comprobante.fecha || "",
          numero_comprobante: comprobante.numero || "",
          glosa_comprobante: comprobante.concepto || "",
          glosa_detalle: det.glosa || "",
          debe,
          haber,
          orden: det.orden || 0,
        }
      })
      .filter((m: any) => m !== null)
      .sort((a: any, b: any) => {
        if (a.cuenta !== b.cuenta) return a.cuenta.localeCompare(b.cuenta)
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
        return String(a.numero_comprobante).localeCompare(String(b.numero_comprobante))
      })

    if (clasificador && clasificador !== "todos") {
      movimientos = movimientos.filter(
        (m: any) => (m.tipo_cuenta || "").toLowerCase() === clasificador.toLowerCase()
      )
    }

    if (movimientos.length === 0) {
      return NextResponse.json(
        { error: "No hay movimientos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    let saldoActual = 0
    let cuentaAnterior = ""
    const movimientosConSaldo = movimientos.map((m: any) => {
      if (cuentaAnterior !== "" && cuentaAnterior !== m.cuenta) saldoActual = 0
      cuentaAnterior = m.cuenta
      saldoActual = saldoActual + m.debe - m.haber
      return { ...m, saldo: saldoActual }
    })

    // A4 vertical (mismo que Balance de Sumas y Saldos)
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const primaryColor: [number, number, number] = [190, 8, 18]
    const currentYear = new Date().getFullYear()
    let yPosition = 10

    // Logo (izquierda) - mismo estilo que balance de sumas y saldos
    const logoBase64 = await cargarLogo()
    if (logoBase64) {
      const aspectRatio = 24 / 5.5
      const maxHeight = 10
      const calculatedWidth = maxHeight * aspectRatio
      const logoWidth = Math.min(calculatedWidth, 45)
      const logoHeight = logoWidth / aspectRatio
      pdf.addImage(logoBase64, "JPEG", margin, yPosition, logoWidth, logoHeight)
    }

    // Nombre de la empresa (derecha)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("Publicidad Vial Imagen S.R.L.", pageWidth - margin, yPosition + 1, { align: "right" })
    pdf.setFont("helvetica", "normal")
    pdf.text("C. Nicolás Acosta Esq. Pedro Blanco", pageWidth - margin, yPosition + 5, { align: "right" })
    pdf.text("(Alto San Pedro) N° 1471", pageWidth - margin, yPosition + 9, { align: "right" })
    pdf.text("La Paz", pageWidth - margin, yPosition + 13, { align: "right" })

    yPosition = 30

    // Título: Libro Mayor
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 0)
    const tituloText = "LIBRO MAYOR"
    pdf.text(tituloText, pageWidth / 2 - pdf.getTextWidth(tituloText) / 2, yPosition)
    yPosition += 10

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    if (fecha_inicial && fecha_final) {
      const fi = new Date(fecha_inicial).toLocaleDateString("es-ES")
      const ff = new Date(fecha_final).toLocaleDateString("es-ES")
      pdf.text(`Período: ${fi} al ${ff}`, margin, yPosition)
      yPosition += 5
    }
    pdf.text(`Moneda: ${moneda === "USD" ? "USD" : "Bs"}`, margin, yPosition)
    yPosition += 5
    pdf.text(`Estado: ${estadoFiltro}`, margin, yPosition)
    yPosition += 8

    // Columnas al estilo Balance: ancho total 180mm (pageWidth - 2*margin)
    const colWidths = [16, 18, 16, 40, 40, 16, 16, 18] // Fecha, Nº Comp., Cuenta, Descripción, Glosa, Debe, Haber, Saldo
    const tableWidth = colWidths.reduce((a, b) => a + b, 0)
    const colHeaders = [
      "Fecha",
      "Nº Comp.",
      "Cuenta",
      "Descripción",
      "Glosa",
      `Debe (${monedaSufijo})`,
      `Haber (${monedaSufijo})`,
      `Saldo (${monedaSufijo})`,
    ]
    const headerHeight = 8

    // Función para dibujar encabezado de tabla (franja gris, mismo estilo que Balance)
    function dibujarEncabezadoTabla() {
      const headerY = yPosition - 5
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.setFillColor(240, 240, 240)
      pdf.setDrawColor(200, 200, 200)
      pdf.setTextColor(0, 0, 0)
      pdf.rect(margin, headerY, tableWidth, headerHeight, "FD")
      let xPos = margin
      for (let i = 0; i < colWidths.length; i++) {
        pdf.line(xPos, headerY, xPos, headerY + headerHeight)
        xPos += colWidths[i]
      }
      pdf.line(xPos, headerY, xPos, headerY + headerHeight)
      xPos = margin
      for (let i = 0; i < colHeaders.length; i++) {
        pdf.text(colHeaders[i], xPos + colWidths[i] / 2, yPosition, { align: "center" })
        xPos += colWidths[i]
      }
      yPosition += headerHeight
    }

    dibujarEncabezadoTabla()

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(0, 0, 0)
    const rowHeight = 6
    const footerHeight = 12
    const maxY = pageHeight - footerHeight - 10

    for (const mov of movimientosConSaldo) {
      if (yPosition > maxY) {
        pdf.addPage()
        yPosition = 20
        dibujarEncabezadoTabla()
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(7)
        pdf.setTextColor(0, 0, 0)
      }

      const fechaStr = mov.fecha
        ? new Date(mov.fecha).toLocaleDateString("es-ES")
        : "-"
      const desc = (mov.descripcion_cuenta || "-").slice(0, 22)
      const glosa = (mov.glosa_comprobante || "-").slice(0, 22)

      let xPos = margin
      pdf.text(fechaStr, xPos + 1, yPosition, { maxWidth: colWidths[0] - 2 })
      xPos += colWidths[0]
      pdf.text(String(mov.numero_comprobante || "-"), xPos + 1, yPosition, { maxWidth: colWidths[1] - 2 })
      xPos += colWidths[1]
      pdf.text(String(mov.cuenta), xPos + 1, yPosition, { maxWidth: colWidths[2] - 2 })
      xPos += colWidths[2]
      pdf.text(desc, xPos + 1, yPosition, { maxWidth: colWidths[3] - 2 })
      xPos += colWidths[3]
      pdf.text(glosa, xPos + 1, yPosition, { maxWidth: colWidths[4] - 2 })
      xPos += colWidths[4]
      pdf.text(
        mov.debe !== 0 ? formatearNumero(mov.debe) : "-",
        xPos + colWidths[5] / 2,
        yPosition,
        { align: "center", maxWidth: colWidths[5] - 2 }
      )
      xPos += colWidths[5]
      pdf.text(
        mov.haber !== 0 ? formatearNumero(mov.haber) : "-",
        xPos + colWidths[6] / 2,
        yPosition,
        { align: "center", maxWidth: colWidths[6] - 2 }
      )
      xPos += colWidths[6]
      pdf.text(formatearNumero(mov.saldo), xPos + colWidths[7] / 2, yPosition, {
        align: "center",
        maxWidth: colWidths[7] - 2,
      })

      yPosition += rowHeight
    }

    // Pie de página (mismo estilo que balance de sumas y saldos)
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
      const webTextWidth = pdf.getTextWidth("contabilidad@publicidadvialimagen.com")
      pdf.text("|", 70 + webTextWidth + 5, footerTextY)
      pdf.text("NIT: 164692025", 70 + webTextWidth + 10, footerTextY)
      const nitTextWidth = pdf.getTextWidth("NIT: 164692025")
      pdf.text("|", 70 + webTextWidth + 10 + nitTextWidth + 5, footerTextY)
      pdf.text(`${i}/${totalPages}`, pageWidth - margin, footerTextY, { align: "right" })
    }

    const buffer = Buffer.from(pdf.output("arraybuffer"))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="libro_mayor.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-mayor/pdf:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF", details: error?.message },
      { status: 500 }
    )
  }
}
