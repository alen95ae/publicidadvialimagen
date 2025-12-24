export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"

// Función para cargar el logo
async function cargarLogo(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
    const logoBuffer = await fs.readFile(logoPath)
    return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error cargando logo:', error)
    return null
  }
}

// Función para formatear números con separador de miles y decimales
function formatearNumero(numero: number): string {
  const numeroFormateado = numero.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${parteEnteraConSeparador},${parteDecimal}`
}

// GET - Generar PDF del Balance de Sumas y Saldos
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"
    const gestion = searchParams.get("gestion")
    const periodo = searchParams.get("periodo")
    const estado = searchParams.get("estado")
    const desdeCuenta = searchParams.get("desde_cuenta")
    const hastaCuenta = searchParams.get("hasta_cuenta")
    const incluirSinMovimiento = searchParams.get("incluir_sin_movimiento") !== "false"
    const nivel = searchParams.get("nivel")
    const tipoCuenta = searchParams.get("tipo_cuenta")

    // Validar parámetros requeridos
    if (!gestion || !periodo) {
      return NextResponse.json(
        { error: "Los parámetros 'gestion' y 'periodo' son requeridos" },
        { status: 400 }
      )
    }

    // Obtener datos del balance (reutilizar lógica del endpoint GET)
    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id")
      .eq("empresa_id", parseInt(empresaId))
      .eq("gestion", parseInt(gestion))
      .eq("periodo", parseInt(periodo))
    
    if (estado && estado.toUpperCase() !== "TODOS") {
      comprobantesQuery = comprobantesQuery.eq("estado", estado.toUpperCase())
    }
    
    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError) {
      return NextResponse.json(
        { error: "Error al obtener los comprobantes", details: comprobantesError.message },
        { status: 500 }
      )
    }

    let movimientos: Record<string, {
      debe_bs: number
      haber_bs: number
      debe_usd: number
      haber_usd: number
    }> = {}

    if (comprobantes && comprobantes.length > 0) {
      const comprobanteIds = comprobantes.map((c: any) => c.id)
      const { data: detalles, error: detallesError } = await supabase
        .from("comprobante_detalle")
        .select("cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
        .in("comprobante_id", comprobanteIds)

      if (detallesError) {
        return NextResponse.json(
          { error: "Error al obtener los detalles", details: detallesError.message },
          { status: 500 }
        )
      }

      ;(detalles || []).forEach((det: any) => {
        if (!movimientos[det.cuenta]) {
          movimientos[det.cuenta] = {
            debe_bs: 0,
            haber_bs: 0,
            debe_usd: 0,
            haber_usd: 0,
          }
        }
        movimientos[det.cuenta].debe_bs += parseFloat(det.debe_bs || 0)
        movimientos[det.cuenta].haber_bs += parseFloat(det.haber_bs || 0)
        movimientos[det.cuenta].debe_usd += parseFloat(det.debe_usd || 0)
        movimientos[det.cuenta].haber_usd += parseFloat(det.haber_usd || 0)
      })
    }

    // Obtener cuentas del plan con filtros
    let cuentasQuery = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta")
      .eq("empresa_id", parseInt(empresaId))
      .eq("vigente", true)
    
    if (desdeCuenta) {
      cuentasQuery = cuentasQuery.gte("cuenta", desdeCuenta)
    }
    if (hastaCuenta) {
      cuentasQuery = cuentasQuery.lte("cuenta", hastaCuenta)
    }
    if (nivel) {
      cuentasQuery = cuentasQuery.lte("nivel", parseInt(nivel))
    }
    if (tipoCuenta) {
      cuentasQuery = cuentasQuery.eq("tipo_cuenta", tipoCuenta)
    }
    
    cuentasQuery = cuentasQuery.order("cuenta", { ascending: true })
    
    const { data: cuentas, error: cuentasError } = await cuentasQuery

    if (cuentasError) {
      return NextResponse.json(
        { error: "Error al obtener el plan de cuentas", details: cuentasError.message },
        { status: 500 }
      )
    }

    // Combinar plan de cuentas con movimientos
    let resultado = (cuentas || []).map((c: any) => {
      const mov = movimientos[c.cuenta] || {
        debe_bs: 0,
        haber_bs: 0,
        debe_usd: 0,
        haber_usd: 0,
      }

      return {
        cuenta: c.cuenta,
        descripcion: c.descripcion,
        nivel: c.nivel,
        tipo_cuenta: c.tipo_cuenta,
        debe_bs: mov.debe_bs,
        haber_bs: mov.haber_bs,
        debe_usd: mov.debe_usd,
        haber_usd: mov.haber_usd,
        saldo_bs: mov.debe_bs - mov.haber_bs,
        saldo_usd: mov.debe_usd - mov.haber_usd,
      }
    })

    // Filtrar cuentas sin movimiento si está desactivado
    if (!incluirSinMovimiento) {
      resultado = resultado.filter((row) => 
        row.debe_bs !== 0 || row.haber_bs !== 0 || row.debe_usd !== 0 || row.haber_usd !== 0
      )
    }

    // Validar que hay datos para mostrar
    if (!resultado || resultado.length === 0) {
      return NextResponse.json(
        { error: "No hay datos para generar el balance con los filtros seleccionados" },
        { status: 400 }
      )
    }

    // Obtener datos del usuario para el footer (opcional, no crítico)
    let userEmail: string | undefined
    let userNumero: string | undefined
    
    try {
      const token = request.cookies.get("session")?.value
      if (token) {
        const { verifySession } = await import("@/lib/auth")
        const payload = await verifySession(token)
        if (payload?.sub) {
          const { getUserByIdSupabase } = await import("@/lib/supabaseUsers")
          const user = await getUserByIdSupabase(payload.sub)
          if (user) {
            userEmail = user.email || undefined
            userNumero = user.numero || undefined
          }
        }
      }
    } catch (error) {
      // No crítico, continuar sin email del usuario
      console.warn("No se pudo obtener email del usuario para el footer:", error)
    }

    // Generar PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const primaryColor: [number, number, number] = [190, 8, 18] // #be0812
    const currentYear = new Date().getFullYear()
    const pageWidth = 210
    let yPosition = 10

    // Cargar y agregar logo (lado izquierdo)
    const logoBase64 = await cargarLogo()
    if (logoBase64) {
      const aspectRatio = 24 / 5.5
      const maxHeight = 10
      const calculatedWidth = maxHeight * aspectRatio
      const logoWidth = Math.min(calculatedWidth, 45)
      const logoHeight = logoWidth / aspectRatio
      
      pdf.addImage(logoBase64, 'JPEG', 15, yPosition, logoWidth, logoHeight)
    }

    // Nombre de la empresa (lado derecho)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Publicidad Vial Imagen S.R.L.', pageWidth - 15, yPosition + 1, { align: 'right' })
    
    pdf.setFont('helvetica', 'normal')
    pdf.text('C. Nicolás Acosta Esq. Pedro Blanco', pageWidth - 15, yPosition + 5, { align: 'right' })
    pdf.text('(Alto San Pedro) N° 1471', pageWidth - 15, yPosition + 9, { align: 'right' })
    pdf.text('La Paz', pageWidth - 15, yPosition + 13, { align: 'right' })

    yPosition = 30

    // Título: Balance de Sumas y Saldos
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const tituloText = 'BALANCE DE SUMAS Y SALDOS'
    const tituloTextWidth = pdf.getTextWidth(tituloText)
    pdf.text(tituloText, (pageWidth - tituloTextWidth) / 2, yPosition)

    yPosition += 10

    // Información de filtros aplicados
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    let infoY = yPosition
    
    if (gestion) {
      pdf.text(`Gestión: ${gestion}`, 15, infoY)
      infoY += 5
    }
    
    if (periodo) {
      const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                     "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
      pdf.text(`Mes: ${meses[parseInt(periodo)]}`, 15, infoY)
      infoY += 5
    }

    if (estado && estado.toUpperCase() !== "TODOS") {
      pdf.text(`Estado: ${estado}`, 15, infoY)
      infoY += 5
    }

    yPosition = infoY + 8

    // Encabezado de la tabla (fondo gris, texto negro negrita, todos los bordes)
    // Columnas: Cuenta, Descripción, Debe BS, Haber BS, Saldo BS, Debe USD, Haber USD, Saldo USD
    // Reducimos las columnas numéricas para que no se salga de la página
    const colWidths = [20, 58, 17, 17, 17, 17, 17, 17] // Total: 180mm (exactamente el ancho disponible)
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0) // 180mm
    const colHeaders = ['Cuenta', 'Descripción', 'Debe BS', 'Haber BS', 'Saldo BS', 'Debe USD', 'Haber USD', 'Saldo USD']
    
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(240, 240, 240) // Fondo gris
    pdf.setDrawColor(200, 200, 200) // Bordes grises
    pdf.setTextColor(0, 0, 0) // Texto negro
    
    const headerY = yPosition - 5
    const headerHeight = 8
    
    // Rectángulo del encabezado con todos los bordes
    pdf.rect(15, headerY, tableWidth, headerHeight, 'FD')
    
    // Líneas verticales para dividir columnas en el encabezado
    let xPos = 15
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[0]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[1]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[2]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[3]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[4]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[5]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[6]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths[7]
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    
    // Texto de encabezados (todos centrados, usando la misma posición base que los datos)
    xPos = 15
    pdf.text('Cuenta', xPos + colWidths[0] / 2, yPosition, { align: 'center' })
    xPos += colWidths[0]
    pdf.text('Descripción', xPos + colWidths[1] / 2, yPosition, { align: 'center' })
    xPos += colWidths[1]
    pdf.text('Debe BS', xPos + colWidths[2] / 2, yPosition, { align: 'center' })
    xPos += colWidths[2]
    pdf.text('Haber BS', xPos + colWidths[3] / 2, yPosition, { align: 'center' })
    xPos += colWidths[3]
    pdf.text('Saldo BS', xPos + colWidths[4] / 2, yPosition, { align: 'center' })
    xPos += colWidths[4]
    pdf.text('Debe USD', xPos + colWidths[5] / 2, yPosition, { align: 'center' })
    xPos += colWidths[5]
    pdf.text('Haber USD', xPos + colWidths[6] / 2, yPosition, { align: 'center' })
    xPos += colWidths[6]
    pdf.text('Saldo USD', xPos + colWidths[7] / 2, yPosition, { align: 'center' })

    yPosition += 8

    // Calcular totales
    let totalDebeBs = 0
    let totalHaberBs = 0
    let totalSaldoBs = 0
    let totalDebeUsd = 0
    let totalHaberUsd = 0
    let totalSaldoUsd = 0

    // Datos de la tabla (solo bordes izquierdo y derecho)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setDrawColor(200, 200, 200) // Color de borde gris

    // Dibujar borde izquierdo y derecho de la tabla
    let tableStartY = yPosition - 3
    let tableEndY = yPosition - 3
    let currentX: number

    for (const row of resultado) {
      // Nueva página si es necesario
      if (yPosition > 250) {
        // Dibujar bordes de la sección anterior antes de cambiar de página
        pdf.line(15, tableStartY, 15, tableEndY) // Borde izquierdo
        pdf.line(15 + tableWidth, tableStartY, 15 + tableWidth, tableEndY) // Borde derecho
        
        pdf.addPage()
        yPosition = 20
        
        // Reimprimir encabezado (mismo estilo: fondo gris, texto negro negrita, todos los bordes)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setFillColor(240, 240, 240)
        pdf.setDrawColor(200, 200, 200)
        pdf.setTextColor(0, 0, 0)
        
        const headerY = yPosition - 5
        pdf.rect(15, headerY, tableWidth, 8, 'FD')
        
        // Líneas verticales del encabezado
        let xPos = 15
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[0]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[1]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[2]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[3]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[4]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[5]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[6]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        xPos += colWidths[7]
        pdf.line(xPos, headerY, xPos, headerY + 8)
        
        // Texto de encabezados (todos centrados, usando la misma posición base que los datos)
        xPos = 15
        pdf.text('Cuenta', xPos + colWidths[0] / 2, yPosition, { align: 'center' })
        xPos += colWidths[0]
        pdf.text('Descripción', xPos + colWidths[1] / 2, yPosition, { align: 'center' })
        xPos += colWidths[1]
        pdf.text('Debe BS', xPos + colWidths[2] / 2, yPosition, { align: 'center' })
        xPos += colWidths[2]
        pdf.text('Haber BS', xPos + colWidths[3] / 2, yPosition, { align: 'center' })
        xPos += colWidths[3]
        pdf.text('Saldo BS', xPos + colWidths[4] / 2, yPosition, { align: 'center' })
        xPos += colWidths[4]
        pdf.text('Debe USD', xPos + colWidths[5] / 2, yPosition, { align: 'center' })
        xPos += colWidths[5]
        pdf.text('Haber USD', xPos + colWidths[6] / 2, yPosition, { align: 'center' })
        xPos += colWidths[6]
        pdf.text('Saldo USD', xPos + colWidths[7] / 2, yPosition, { align: 'center' })
        
        yPosition += 8
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        
        // Reiniciar posición de inicio de tabla para nueva página
        tableStartY = yPosition - 3
        tableEndY = yPosition - 3
      }

      currentX = 15
      pdf.text(row.cuenta, currentX + 1, yPosition, { maxWidth: colWidths[0] - 2 })
      currentX += colWidths[0]
      
      // Descripción con maxWidth más estricto para que no se salga de su columna
      // Reducimos el ancho disponible para forzar el salto de línea antes
      const descripcionText = row.descripcion || ''
      const descripcionMaxWidth = colWidths[1] - 4 // Más estricto: -4 en lugar de -2
      const descripcionLines = pdf.splitTextToSize(descripcionText, descripcionMaxWidth)
      const initialY = yPosition
      for (let i = 0; i < descripcionLines.length; i++) {
        pdf.text(descripcionLines[i], currentX + 1, initialY + (i * 5), { maxWidth: descripcionMaxWidth })
      }
      // Ajustar yPosition si la descripción tiene múltiples líneas
      if (descripcionLines.length > 1) {
        yPosition += (descripcionLines.length - 1) * 5
      }
      currentX += colWidths[1]
      
      // Datos numéricos centrados para alinearse con los títulos
      pdf.text(formatearNumero(row.debe_bs), currentX + colWidths[2] / 2, yPosition, { align: 'center', maxWidth: colWidths[2] - 2 })
      currentX += colWidths[2]
      
      pdf.text(formatearNumero(row.haber_bs), currentX + colWidths[3] / 2, yPosition, { align: 'center', maxWidth: colWidths[3] - 2 })
      currentX += colWidths[3]
      
      pdf.text(formatearNumero(row.saldo_bs), currentX + colWidths[4] / 2, yPosition, { align: 'center', maxWidth: colWidths[4] - 2 })
      currentX += colWidths[4]
      
      pdf.text(formatearNumero(row.debe_usd), currentX + colWidths[5] / 2, yPosition, { align: 'center', maxWidth: colWidths[5] - 2 })
      currentX += colWidths[5]
      
      pdf.text(formatearNumero(row.haber_usd), currentX + colWidths[6] / 2, yPosition, { align: 'center', maxWidth: colWidths[6] - 2 })
      currentX += colWidths[6]
      
      pdf.text(formatearNumero(row.saldo_usd), currentX + colWidths[7] / 2, yPosition, { align: 'center', maxWidth: colWidths[7] - 2 })

      totalDebeBs += row.debe_bs
      totalHaberBs += row.haber_bs
      totalSaldoBs += row.saldo_bs
      totalDebeUsd += row.debe_usd
      totalHaberUsd += row.haber_usd
      totalSaldoUsd += row.saldo_usd

      tableEndY = yPosition + 2
      yPosition += 5
    }
    
    // Dibujar bordes izquierdo y derecho al final de la tabla
    pdf.line(15, tableStartY, 15, tableEndY) // Borde izquierdo
    pdf.line(15 + tableWidth, tableStartY, 15 + tableWidth, tableEndY) // Borde derecho

    // Línea de totales
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    yPosition += 2
    pdf.setDrawColor(0, 0, 0)
    pdf.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 3

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    currentX = 15
    pdf.text('TOTALES', currentX + 1, yPosition)
    currentX += colWidths[0] + colWidths[1]
    
    // Totaless centrados para alinearse con los títulos y datos
    pdf.text(formatearNumero(totalDebeBs), currentX + colWidths[2] / 2, yPosition, { align: 'center', maxWidth: colWidths[2] - 2 })
    currentX += colWidths[2]
    
    pdf.text(formatearNumero(totalHaberBs), currentX + colWidths[3] / 2, yPosition, { align: 'center', maxWidth: colWidths[3] - 2 })
    currentX += colWidths[3]
    
    pdf.text(formatearNumero(totalSaldoBs), currentX + colWidths[4] / 2, yPosition, { align: 'center', maxWidth: colWidths[4] - 2 })
    currentX += colWidths[4]
    
    pdf.text(formatearNumero(totalDebeUsd), currentX + colWidths[5] / 2, yPosition, { align: 'center', maxWidth: colWidths[5] - 2 })
    currentX += colWidths[5]
    
    pdf.text(formatearNumero(totalHaberUsd), currentX + colWidths[6] / 2, yPosition, { align: 'center', maxWidth: colWidths[6] - 2 })
    currentX += colWidths[6]
    
    pdf.text(formatearNumero(totalSaldoUsd), currentX + colWidths[7] / 2, yPosition, { align: 'center', maxWidth: colWidths[7] - 2 })

    // Footer (igual que libro diario)
    const totalPages = pdf.getNumberOfPages()
    const pageHeight = 297
    const footerHeight = 12
    const footerY = pageHeight - footerHeight

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      // Fondo rojo del footer
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, pageWidth, footerHeight, 'F')
      
      // Texto en blanco
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      
      const footerTextY = footerY + (footerHeight / 2) + 2
      
      // Izquierda: © 2025 Publicidad Vial Imagen
      const leftText = `© ${currentYear} Publicidad Vial Imagen`
      const leftTextWidth = pdf.getTextWidth(leftText)
      pdf.text(leftText, 5, footerTextY)
      
      // Separador 1 (entre izquierda y centro)
      pdf.text('|', 65, footerTextY)
      
      // Centro: contabilidad@publicidadvialimagen.com
      pdf.text('contabilidad@publicidadvialimagen.com', 70, footerTextY)
      
      // Separador 2 (entre email y NIT)
      const webTextWidth = pdf.getTextWidth('contabilidad@publicidadvialimagen.com')
      const separator2X = 70 + webTextWidth + 5
      pdf.text('|', separator2X, footerTextY)
      
      // NIT
      const nitX = separator2X + 5
      pdf.text('NIT: 164692025', nitX, footerTextY)
      
      // Separador 3 (antes de paginación)
      const nitTextWidth = pdf.getTextWidth('NIT: 164692025')
      const separator3X = nitX + nitTextWidth + 5
      pdf.text('|', separator3X, footerTextY)
      
      // Paginación (derecha)
      const paginationText = `${i}/${totalPages}`
      const paginationX = pageWidth - 15
      pdf.text(paginationText, paginationX, footerTextY, { align: 'right' })
    }

    // Devolver PDF
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="balance_sumas_saldos_${gestion}_${periodo}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("❌ Error generating PDF:", error)
    console.error("❌ Stack:", error?.stack)
    return NextResponse.json(
      { 
        error: "Error al generar el PDF",
        details: error?.message || "Error desconocido"
      },
      { status: 500 }
    )
  }
}

