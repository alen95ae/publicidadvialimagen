export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, getSupabaseUser } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import jsPDF from "jspdf"
import path from "path"
import fs from "fs/promises"

// Función para obtener el email a mostrar en el footer
function obtenerEmailFooter(email?: string): string | undefined {
  if (!email) return undefined
  
  const emailsPersonales = [
    'alen95ae@gmail.com',
    'alen_ae@hotmail.com',
    'alen_ae@outlook.com'
  ]
  
  if (emailsPersonales.includes(email.toLowerCase().trim())) {
    return 'comercial@publicidadvialimagen.com'
  }
  
  return email
}

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

// GET - Generar PDF del Libro Diario
export async function GET(request: NextRequest) {
  try {
    console.log("📄 Iniciando generación de PDF del Libro Diario")
    
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      console.error("❌ Sin permisos para exportar PDF")
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const gestion = searchParams.get("gestion")
    const periodo = searchParams.get("periodo")
    const tipo_asiento = searchParams.get("tipo_asiento")
    const fecha_inicial = searchParams.get("fecha_inicial")
    const fecha_final = searchParams.get("fecha_final")
    const tipo_comprobante = searchParams.get("tipo_comprobante")
    const estado = searchParams.get("estado")

    // Construir query base para comprobantes (mismo que el endpoint GET)
    let query = supabase
      .from("comprobantes")
      .select(
        `
        id,
        numero,
        fecha,
        tipo_comprobante,
        tipo_asiento,
        concepto,
        moneda,
        tipo_cambio,
        estado,
        empresa_id,
        gestion,
        periodo
      `
      )
      .eq("empresa_id", 1)
      .order("fecha", { ascending: true })
      .order("numero", { ascending: true })

    // Aplicar filtros opcionales
    if (gestion) {
      query = query.eq("gestion", parseInt(gestion))
    }

    if (periodo) {
      query = query.eq("periodo", parseInt(periodo))
    }

    if (tipo_asiento) {
      query = query.eq("tipo_asiento", tipo_asiento)
    }

    if (fecha_inicial) {
      query = query.gte("fecha", fecha_inicial)
    }

    if (fecha_final) {
      query = query.lte("fecha", fecha_final)
    }

    if (tipo_comprobante) {
      query = query.eq("tipo_comprobante", tipo_comprobante)
    }

    // Filtro de estado: por defecto solo APROBADOS
    const estadoFiltro = estado && estado !== "Todos"
      ? estado.toUpperCase()
      : "APROBADO"
    query = query.eq("estado", estadoFiltro)

    const { data: comprobantes, error: comprobantesError } = await query

    if (comprobantesError) {
      console.error("Error fetching comprobantes:", comprobantesError)
      return NextResponse.json(
        {
          error: "Error al obtener los comprobantes",
          details: comprobantesError.message,
        },
        { status: 500 }
      )
    }

    if (!comprobantes || comprobantes.length === 0) {
      console.warn("⚠️ No hay comprobantes para exportar con los filtros aplicados")
      return NextResponse.json(
        { error: "No hay comprobantes para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    console.log(`✅ Encontrados ${comprobantes.length} comprobantes para exportar`)

    // Obtener IDs de comprobantes
    const comprobanteIds = comprobantes.map((c: any) => c.id)

    // Obtener detalles de comprobantes
    const { data: detalles, error: detallesError } = await supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, auxiliar, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
      .in("comprobante_id", comprobanteIds)
      .order("comprobante_id", { ascending: true })
      .order("orden", { ascending: true })

    if (detallesError) {
      console.error("Error fetching detalles:", detallesError)
      return NextResponse.json(
        {
          error: "Error al obtener los detalles",
          details: detallesError.message,
        },
        { status: 500 }
      )
    }

    // Obtener descripciones de cuentas
    const cuentaCodes = [...new Set((detalles || []).map((d: any) => d.cuenta))]
    let cuentasMap: Record<string, string> = {}

    if (cuentaCodes.length > 0) {
      const { data: cuentas } = await supabase
        .from("plan_cuentas")
        .select("cuenta, descripcion")
        .in("cuenta", cuentaCodes)

      if (cuentas) {
        cuentasMap = cuentas.reduce((acc: Record<string, string>, c: any) => {
          acc[c.cuenta] = c.descripcion
          return acc
        }, {})
      }
    }

    // Agrupar detalles por comprobante
    const detallesPorComprobante = (detalles || []).reduce(
      (acc: Record<number, any[]>, detalle: any) => {
        if (!acc[detalle.comprobante_id]) {
          acc[detalle.comprobante_id] = []
        }
        acc[detalle.comprobante_id].push(detalle)
        return acc
      },
      {}
    )

    // Obtener información del usuario para el footer
    let userEmail: string | undefined
    let userNumero: string | undefined
    
    try {
      const supabaseUser = await getSupabaseUser(request)
      if (supabaseUser) {
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (user?.email) {
          userEmail = user.email
          const { data: usuarioData } = await supabaseUser
            .from("usuarios")
            .select("numero")
            .eq("id", user.id)
            .single()
          if (usuarioData?.numero) {
            userNumero = usuarioData.numero
          }
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error)
    }

    console.log("📝 Generando PDF...")
    
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

    // Título: Libro Diario
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const tituloText = 'LIBRO DIARIO'
    const tituloTextWidth = pdf.getTextWidth(tituloText)
    pdf.text(tituloText, (pageWidth - tituloTextWidth) / 2, yPosition)

    yPosition += 10

    // Información de filtros aplicados
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    let infoY = yPosition
    
    if (fecha_inicial && fecha_final) {
      const fechaIni = new Date(fecha_inicial).toLocaleDateString('es-ES')
      const fechaFin = new Date(fecha_final).toLocaleDateString('es-ES')
      pdf.text(`Período: ${fechaIni} al ${fechaFin}`, 15, infoY)
      infoY += 5
    }
    
    if (gestion) {
      pdf.text(`Gestión: ${gestion}`, 15, infoY)
      infoY += 5
    }
    
    if (periodo && periodo !== "0") {
      const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                     "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
      pdf.text(`Mes: ${meses[parseInt(periodo)]}`, 15, infoY)
      infoY += 5
    }

    yPosition = infoY + 8

    // Calcular totales generales
    let totalDebeBs = 0
    let totalHaberBs = 0
    let totalDebeUsd = 0
    let totalHaberUsd = 0

    // BUCLE PRINCIPAL: Iterar sobre comprobantes (línea ~366)
    for (const comprobante of comprobantes) {
      try {
        const detallesComp = detallesPorComprobante[comprobante.id] || []
        
        if (detallesComp.length === 0) {
          console.warn(`⚠️ Comprobante ${comprobante.id} no tiene detalles`)
          continue
        }

        console.log(`📄 Procesando comprobante ${comprobante.id} con ${detallesComp.length} detalles`)

        // Nueva página si es necesario
        if (yPosition > 240) {
          pdf.addPage()
          yPosition = 20
        }

        // ===== ENCABEZADO DEL COMPROBANTE =====
        const fechaComp = new Date(comprobante.fecha).toLocaleDateString('es-ES')
        const numeroComp = comprobante.numero || 'N/A'
        const tipoComp = comprobante.tipo_comprobante || 'N/A'
        const estadoComp = comprobante.estado || 'N/A'
        const conceptoComp = comprobante.concepto || ''
        
        pdf.setFillColor(245, 245, 245)
        const compHeaderHeight = 8
        pdf.rect(15, yPosition - 5, pageWidth - 30, compHeaderHeight, 'F')
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(15, yPosition - 5, pageWidth - 30, compHeaderHeight, 'D')
        
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)
        
        // Primera línea: Número, Fecha, Tipo, Concepto | Estado a la derecha
        let currentX = 17
        const lineY = yPosition
        
        pdf.setFont('helvetica', 'bold')
        pdf.text(`N°: ${numeroComp}`, currentX, lineY)
        currentX += pdf.getTextWidth(`N°: ${numeroComp}`) + 5
        
        pdf.text(`Fecha: ${fechaComp}`, currentX, lineY)
        currentX += pdf.getTextWidth(`Fecha: ${fechaComp}`) + 5
        
        // Tipo: "Comprobante de [Tipo]"
        pdf.text(`Comprobante de ${tipoComp}`, currentX, lineY)
        currentX += pdf.getTextWidth(`Comprobante de ${tipoComp}`) + 5
        
        // Concepto inmediatamente después del tipo (con espacio)
        if (conceptoComp) {
          pdf.setFont('helvetica', 'bold')
          const conceptoText = `Concepto: ${conceptoComp}`
          pdf.text(conceptoText, currentX, lineY)
        }

        yPosition += 8

        // ===== TABLA DE DETALLES DEL COMPROBANTE =====
        const tableWidth = pageWidth - 30
        const colWidths = {
          cuenta: 30,
          descripcion: 70,
          debeBs: (tableWidth - 30 - 70) / 4,
          haberBs: (tableWidth - 30 - 70) / 4,
          debeUsd: (tableWidth - 30 - 70) / 4,
          haberUsd: (tableWidth - 30 - 70) / 4
        }

        // Encabezados de tabla
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setFillColor(240, 240, 240)
        const tableHeaderY = yPosition - 5
        const tableHeaderHeight = 8
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(15, tableHeaderY, tableWidth, tableHeaderHeight, 'FD')
        
        // Líneas verticales para dividir columnas
        let xPos = 15
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.cuenta
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.descripcion
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.debeBs
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.haberBs
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.debeUsd
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        xPos += colWidths.haberUsd
        pdf.line(xPos, tableHeaderY, xPos, tableHeaderY + tableHeaderHeight)
        
        // Texto de encabezados
        xPos = 15
        pdf.text('Cuenta', xPos + 2, yPosition)
        xPos += colWidths.cuenta
        pdf.text('Descripción', xPos + 2, yPosition)
        xPos += colWidths.descripcion
        pdf.text('Debe Bs', xPos + colWidths.debeBs / 2, yPosition, { align: 'center' })
        xPos += colWidths.debeBs
        pdf.text('Haber Bs', xPos + colWidths.haberBs / 2, yPosition, { align: 'center' })
        xPos += colWidths.haberBs
        pdf.text('Debe USD', xPos + colWidths.debeUsd / 2, yPosition, { align: 'center' })
        xPos += colWidths.debeUsd
        pdf.text('Haber USD', xPos + colWidths.haberUsd / 2, yPosition, { align: 'center' })

        yPosition += 8
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')

        // Totales del comprobante
        let totalComprobanteDebeBs = 0
        let totalComprobanteHaberBs = 0
        let totalComprobanteDebeUsd = 0
        let totalComprobanteHaberUsd = 0

        // BUCLE DE DETALLES: Iterar sobre detalles del comprobante (línea ~394)
        for (const detalle of detallesComp) {
          if (yPosition > 250) {
            pdf.addPage()
            yPosition = 20
          }

          // Mostrar descripción de cuenta o glosa del detalle (igual que en la interfaz)
          const descripcionCuenta = cuentasMap[detalle.cuenta] || ""
          const glosaDetalle = detalle.glosa && String(detalle.glosa).trim() !== "" ? String(detalle.glosa).trim() : null
          const descripcion = descripcionCuenta || glosaDetalle || "-"
          const descripcionLines = pdf.splitTextToSize(descripcion, colWidths.descripcion - 4)
          const rowHeight = Math.max(6, descripcionLines.length * 4)

          // Líneas verticales
          pdf.setDrawColor(200, 200, 200)
          xPos = 15
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.cuenta
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.descripcion
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.debeBs
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.haberBs
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.debeUsd
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)
          xPos += colWidths.haberUsd
          pdf.line(xPos, yPosition - 3, xPos, yPosition - 3 + rowHeight)

          // Datos de la fila
          xPos = 15
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'normal')
          pdf.text(detalle.cuenta || "", xPos + 2, yPosition)
          xPos += colWidths.cuenta
          pdf.text(descripcionLines, xPos + 2, yPosition)
          xPos += colWidths.descripcion
          
          const debeBs = detalle.debe_bs || 0
          const haberBs = detalle.haber_bs || 0
          const debeUsd = detalle.debe_usd || 0
          const haberUsd = detalle.haber_usd || 0
          
          pdf.text(formatearNumero(debeBs), xPos + colWidths.debeBs / 2, yPosition, { align: 'center' })
          totalComprobanteDebeBs += debeBs
          totalDebeBs += debeBs
          xPos += colWidths.debeBs
          
          pdf.text(formatearNumero(haberBs), xPos + colWidths.haberBs / 2, yPosition, { align: 'center' })
          totalComprobanteHaberBs += haberBs
          totalHaberBs += haberBs
          xPos += colWidths.haberBs
          
          pdf.text(formatearNumero(debeUsd), xPos + colWidths.debeUsd / 2, yPosition, { align: 'center' })
          totalComprobanteDebeUsd += debeUsd
          totalDebeUsd += debeUsd
          xPos += colWidths.debeUsd
          
          pdf.text(formatearNumero(haberUsd), xPos + colWidths.haberUsd / 2, yPosition, { align: 'center' })
          totalComprobanteHaberUsd += haberUsd
          totalHaberUsd += haberUsd

          yPosition += rowHeight
        }

        // ===== TOTALES DEL COMPROBANTE =====
        yPosition += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setFillColor(240, 240, 240) // Gris como el encabezado de la tabla
        const totalCompY = yPosition - 5
        const totalCompHeight = 8
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(15, totalCompY, tableWidth, totalCompHeight, 'FD')
        pdf.setTextColor(0, 0, 0) // Texto negro
        
        // Líneas verticales grises
        pdf.setDrawColor(200, 200, 200)
        xPos = 15
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.cuenta
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.descripcion
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.debeBs
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.haberBs
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.debeUsd
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        xPos += colWidths.haberUsd
        pdf.line(xPos, totalCompY, xPos, totalCompY + totalCompHeight)
        
        xPos = 15 + colWidths.cuenta + colWidths.descripcion
        pdf.text('TOTALES:', xPos - colWidths.descripcion + 2, yPosition)
        pdf.text(formatearNumero(totalComprobanteDebeBs), xPos + colWidths.debeBs / 2, yPosition, { align: 'center' })
        xPos += colWidths.debeBs
        pdf.text(formatearNumero(totalComprobanteHaberBs), xPos + colWidths.haberBs / 2, yPosition, { align: 'center' })
        xPos += colWidths.haberBs
        pdf.text(formatearNumero(totalComprobanteDebeUsd), xPos + colWidths.debeUsd / 2, yPosition, { align: 'center' })
        xPos += colWidths.debeUsd
        pdf.text(formatearNumero(totalComprobanteHaberUsd), xPos + colWidths.haberUsd / 2, yPosition, { align: 'center' })
        
        yPosition += 10

      } catch (error: any) {
        console.error(`❌ Error procesando comprobante ${comprobante.id}:`, error)
        console.error(`❌ Stack:`, error?.stack)
        // Continuar con el siguiente comprobante
      }
    }

    // ===== TOTALES GENERALES =====
    yPosition += 5
    
    // Nueva página si es necesario para los totales
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    // Totales generales (granate como estaba originalmente)
    pdf.setFontSize(8) // Mismo tamaño que totales del comprobante
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]) // Granate
    const totalY = yPosition - 5
    const totalHeight = 8 // Misma altura que totales del comprobante
    const totalTableWidth = pageWidth - 30
    const totalColWidths = {
      cuenta: 30,
      descripcion: 70,
      debeBs: (totalTableWidth - 30 - 70) / 4,
      haberBs: (totalTableWidth - 30 - 70) / 4,
      debeUsd: (totalTableWidth - 30 - 70) / 4,
      haberUsd: (totalTableWidth - 30 - 70) / 4
    }
    
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(15, totalY, totalTableWidth, totalHeight, 'FD')
    pdf.setTextColor(255, 255, 255) // Texto blanco
    
    // Líneas verticales blancas
    pdf.setDrawColor(255, 255, 255)
    let xPos = 15
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.cuenta
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.descripcion
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.debeBs
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.haberBs
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.debeUsd
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += totalColWidths.haberUsd
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    
    xPos = 15 + totalColWidths.cuenta + totalColWidths.descripcion
    pdf.text('TOTALES GENERALES:', xPos - totalColWidths.descripcion + 2, yPosition)
    pdf.text(formatearNumero(totalDebeBs), xPos + totalColWidths.debeBs / 2, yPosition, { align: 'center' })
    xPos += totalColWidths.debeBs
    pdf.text(formatearNumero(totalHaberBs), xPos + totalColWidths.haberBs / 2, yPosition, { align: 'center' })
    xPos += totalColWidths.haberBs
    pdf.text(formatearNumero(totalDebeUsd), xPos + totalColWidths.debeUsd / 2, yPosition, { align: 'center' })
    xPos += totalColWidths.debeUsd
    pdf.text(formatearNumero(totalHaberUsd), xPos + totalColWidths.haberUsd / 2, yPosition, { align: 'center' })
    
    console.log(`✅ Totales generales calculados: Debe Bs=${totalDebeBs}, Haber Bs=${totalHaberBs}, Debe USD=${totalDebeUsd}, Haber USD=${totalHaberUsd}`)

    // Footer (igual que comprobantes)
    const totalPages = pdf.getNumberOfPages()
    const pageHeight = 297
    const footerHeight = 12
    const footerY = pageHeight - footerHeight

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      // Fondo granate del footer
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, 210, footerHeight, 'F')
      
      // Texto en blanco
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      
      const footerTextY = footerY + (footerHeight / 2) + 2
      
      // Izquierda: © 2025 Publicidad Vial Imagen
      const leftText = `© ${currentYear} Publicidad Vial Imagen`
      const leftTextWidth = pdf.getTextWidth(leftText)
      pdf.text(leftText, 5, footerTextY)
      
      // Calcular posiciones para centrar email y NIT
      const webText = 'contabilidad@publicidadvialimagen.com'
      const nitText = 'NIT: 164692025'
      const webTextWidth = pdf.getTextWidth(webText)
      const nitTextWidth = pdf.getTextWidth(nitText)
      
      // Email y número del usuario (derecha)
      const emailFooter = obtenerEmailFooter(userEmail)
      let rightContentWidth = 0
      if (emailFooter) {
        rightContentWidth += pdf.getTextWidth(emailFooter) + 5
        if (userNumero) {
          rightContentWidth += 5 + pdf.getTextWidth(userNumero) + 5
        }
      } else if (userNumero) {
        rightContentWidth += pdf.getTextWidth(userNumero) + 5
      }
      
      // Paginación (derecha)
      const paginationText = `${i}/${totalPages}`
      const paginationWidth = pdf.getTextWidth(paginationText)
      rightContentWidth += paginationWidth + 10
      
      // Espacio disponible para centrar email y NIT
      const leftEndX = 5 + leftTextWidth + 5
      const rightStartX = pageWidth - 15 - rightContentWidth
      const availableWidth = rightStartX - leftEndX
      const centerContentWidth = webTextWidth + 5 + nitTextWidth
      const spacing = (availableWidth - centerContentWidth) / 3
      
      // Separador 1
      const separator1X = leftEndX + spacing
      pdf.text('|', separator1X, footerTextY)
      
      // Email de contabilidad (centrado)
      const webX = separator1X + 5
      pdf.text(webText, webX, footerTextY)
      
      // Separador 2
      const separator2X = webX + webTextWidth + 5
      pdf.text('|', separator2X, footerTextY)
      
      // NIT (centrado)
      const nitX = separator2X + 5
      pdf.text(nitText, nitX, footerTextY)
      
      // Separador 3
      const separator3X = nitX + nitTextWidth + spacing
      pdf.text('|', separator3X, footerTextY)
      
      // Email y número del usuario
      let rightContentX = separator3X + 5
      if (emailFooter) {
        pdf.text(emailFooter, rightContentX, footerTextY)
        rightContentX += pdf.getTextWidth(emailFooter) + 5
        
        if (userNumero) {
          pdf.text('|', rightContentX, footerTextY)
          rightContentX += 5
        }
      }
      
      if (userNumero) {
        pdf.text(userNumero, rightContentX, footerTextY)
        rightContentX += pdf.getTextWidth(userNumero) + 5
      }
      
      // Paginación
      const paginationX = pageWidth - 15
      pdf.text(paginationText, paginationX, footerTextY, { align: 'right' })
    }

    // Generar nombre del archivo con formato DD-MM-YYYY
    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, '0')
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const año = hoy.getFullYear()
    const nombreArchivo = `libro_diario_${dia}-${mes}-${año}.pdf`

    console.log("✅ PDF generado correctamente, tamaño:", pdf.getNumberOfPages(), "páginas")

    // Devolver PDF como buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
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

