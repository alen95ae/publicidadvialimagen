/**
 * API para exportar historial de stock a PDF
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import jsPDF from 'jspdf'
import path from "path"
import fs from "fs/promises"

const supabase = getSupabaseServer()

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

// Función para obtener el email a mostrar en el footer
function obtenerEmailFooter(email?: string): string | undefined {
  if (!email) return undefined
  
  // Lista de emails que deben mostrar el email comercial
  const emailsPersonales = [
    'alen95ae@gmail.com',
    'alen_ae@hotmail.com',
    'alen_ae@outlook.com'
  ]
  
  // Si el email está en la lista, retornar el email comercial
  if (emailsPersonales.includes(email.toLowerCase().trim())) {
    return 'comercial@publicidadvialimagen.com'
  }
  
  // Si no, retornar el email original
  return email
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const itemTipo = searchParams.get('item_tipo')
    const origen = searchParams.get('origen')
    const sucursal = searchParams.get('sucursal')
    const fechaDesde = searchParams.get('fecha_desde')
    const fechaHasta = searchParams.get('fecha_hasta')
    const itemId = searchParams.get('item_id')
    const referenciaCodigo = searchParams.get('referencia_codigo')

    let query = supabase
      .from('historial_stock')
      .select('*')
      .order('fecha', { ascending: false })

    // Aplicar filtros
    if (itemTipo && itemTipo !== 'all') {
      query = query.eq('item_tipo', itemTipo)
    }

    if (origen && origen !== 'all') {
      query = query.eq('origen', origen)
    }

    if (sucursal && sucursal !== 'all') {
      query = query.eq('sucursal', sucursal)
    }

    if (fechaDesde) {
      query = query.gte('fecha', fechaDesde)
    }

    if (fechaHasta) {
      query = query.lte('fecha', fechaHasta)
    }

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    if (referenciaCodigo) {
      query = query.ilike('referencia_codigo', `%${referenciaCodigo}%`)
    }

    // Obtener todos los registros (sin paginación)
    const { data, error } = await query

    if (error) {
      console.error('❌ Error obteniendo historial para PDF:', error)
      return NextResponse.json(
        { error: 'Error al obtener datos del historial' },
        { status: 500 }
      )
    }

    // Validar que hay datos para mostrar
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para generar el historial con los filtros seleccionados' },
        { status: 400 }
      )
    }

    // Para registros de cotizaciones, obtener el usuario que aprobó desde la cotización
    const dataConUsuario = await Promise.all((data || []).map(async (entry: any) => {
      if (
        (entry.origen === 'cotizacion_aprobada' || 
         entry.origen === 'cotizacion_rechazada' || 
         entry.origen === 'cotizacion_editada' || 
         entry.origen === 'cotizacion_eliminada') &&
        entry.referencia_id
      ) {
        try {
          // Intentar primero por ID
          let cotizacion = null
          
          if (entry.referencia_id) {
            const { data: cotizaciones } = await supabase
              .from('cotizaciones')
              .select('id, vendedor')
              .eq('id', entry.referencia_id)
            
            if (cotizaciones && cotizaciones.length > 0) {
              cotizacion = cotizaciones[0]
            }
          }
          
          // Si no se encontró por ID, intentar por código
          if (!cotizacion && entry.referencia_codigo) {
            const { data: cotizacionesPorCodigo } = await supabase
              .from('cotizaciones')
              .select('id, vendedor')
              .eq('codigo', entry.referencia_codigo)
            
            if (cotizacionesPorCodigo && cotizacionesPorCodigo.length > 0) {
              cotizacion = cotizacionesPorCodigo[0]
            }
          }
          
          if (cotizacionError) {
            console.warn(`⚠️ Error obteniendo cotización ${entry.referencia_id}:`, cotizacionError)
          }
          
          if (cotizacion?.vendedor) {
            let usuarioNombreCotizacion = cotizacion.vendedor
            let usuarioIdCotizacion = null

            // Si el vendedor es un UUID, buscar el nombre del usuario
            if (cotizacion.vendedor.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
              const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('id', cotizacion.vendedor)
                .single()
              
              if (userData && !userError) {
                usuarioNombreCotizacion = userData.nombre
                usuarioIdCotizacion = userData.id
              } else if (userError) {
                console.warn(`⚠️ Error obteniendo usuario por ID ${cotizacion.vendedor}:`, userError)
                // Intentar buscar por nombre como fallback
                const { data: userDataByName } = await supabase
                  .from('usuarios')
                  .select('id, nombre')
                  .eq('nombre', cotizacion.vendedor)
                  .single()
                
                if (userDataByName) {
                  usuarioNombreCotizacion = userDataByName.nombre
                  usuarioIdCotizacion = userDataByName.id
                }
              }
            } else {
              // Si el vendedor es un nombre, intentar obtener el ID del usuario
              const { data: userDataByName } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('nombre', cotizacion.vendedor)
                .single()
              
              if (userDataByName) {
                usuarioIdCotizacion = userDataByName.id
              }
            }

            return {
              ...entry,
              usuario_id: usuarioIdCotizacion || entry.usuario_id,
              usuario_nombre: usuarioNombreCotizacion || entry.usuario_nombre
            }
          }
        } catch (err) {
          console.warn('⚠️ No se pudo obtener usuario de cotización:', err)
        }
      }
      return entry
    }))

    // Obtener información del usuario para el footer
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
      console.warn("No se pudo obtener email del usuario para el footer:", error)
    }

    // Generar PDF
    const pdf = new jsPDF('l', 'mm', 'a4') // Landscape para más espacio horizontal
    const primaryColor: [number, number, number] = [190, 8, 18] // #be0812
    const currentYear = new Date().getFullYear()
    const pageWidth = 297 // A4 landscape width
    const pageHeight = 210 // A4 landscape height
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

    // Título: Historial de Stock
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const tituloText = 'HISTORIAL DE STOCK'
    const tituloTextWidth = pdf.getTextWidth(tituloText)
    pdf.text(tituloText, (pageWidth - tituloTextWidth) / 2, yPosition)

    yPosition += 10

    // Información de filtros aplicados (a la izquierda de "Fecha hasta")
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    let infoY = yPosition
    
    const origenLabels: Record<string, string> = {
      'registro_manual': 'Registro Manual',
      'cotizacion_aprobada': 'Cotización Aprobada',
      'cotizacion_rechazada': 'Cotización Rechazada',
      'cotizacion_editada': 'Cotización Editada',
      'cotizacion_eliminada': 'Cotización Eliminada'
    }

    // Construir lista de filtros para mostrar a la izquierda de "Fecha hasta"
    const filtrosAplicados: string[] = []
    if (itemTipo && itemTipo !== 'all') {
      filtrosAplicados.push(`Tipo de Ítem: ${itemTipo}`)
    }
    
    if (origen && origen !== 'all') {
      filtrosAplicados.push(`Origen: ${origenLabels[origen] || origen}`)
    }

    if (sucursal && sucursal !== 'all') {
      filtrosAplicados.push(`Sucursal: ${sucursal}`)
    }

    if (referenciaCodigo) {
      filtrosAplicados.push(`Referencia: ${referenciaCodigo}`)
    }

    // Mostrar filtros y fechas en la misma línea
    let xPosFiltros = 15
    if (filtrosAplicados.length > 0) {
      const filtrosTexto = filtrosAplicados.join(' | ')
      pdf.text(filtrosTexto, xPosFiltros, infoY)
      xPosFiltros += pdf.getTextWidth(filtrosTexto) + 10
    }

    // Fechas a la derecha de los filtros
    if (fechaDesde) {
      pdf.text(`Fecha desde: ${fechaDesde}`, xPosFiltros, infoY)
      xPosFiltros += pdf.getTextWidth(`Fecha desde: ${fechaDesde}`) + 10
    }

    if (fechaHasta) {
      pdf.text(`Fecha hasta: ${fechaHasta}`, xPosFiltros, infoY)
    }

    yPosition = infoY + 8

    // Encabezado de la tabla (fondo gris, texto negro negrita, todos los bordes)
    // Columnas: Fecha, Origen, Tipo, Código, Ítem, Sucursal, Cantidad, Impacto, Stock Ant., Stock Nuevo, Tipo Mov., Referencia, Usuario (al final)
    const tableWidth = 267 // Ancho total de la tabla (297mm - 30mm de márgenes)
    const colHeaders = ['Fecha', 'Origen', 'Tipo', 'Código', 'Ítem', 'Sucursal', 'Cantidad', 'Impacto', 'Stock Ant.', 'Stock Nuevo', 'Tipo Mov.', 'Referencia', 'Usuario']
    
    // Anchos base (proporcionales) - ajustados para llenar todo el espacio sin dejar huecos
    const baseWidths = [
      20,  // Fecha
      18,  // Origen
      14,  // Tipo
      15,  // Código
      38,  // Ítem (más ancho porque tiene nombres largos)
      16,  // Sucursal
      19,  // Cantidad
      13,  // Impacto
      16,  // Stock Ant.
      16,  // Stock Nuevo
      17,  // Tipo Mov.
      19,  // Referencia
      20   // Usuario (última columna)
    ]
    
    // Calcular el ancho total de los anchos base
    const totalBaseWidth = baseWidths.reduce((sum, width) => sum + width, 0)
    
    // Redistribuir proporcionalmente para llenar exactamente tableWidth (267mm)
    const finalColWidths = baseWidths.map((width, index) => {
      const proportionalWidth = (width / totalBaseWidth) * tableWidth
      // Redondear a 2 decimales para mantener precisión
      return Math.round(proportionalWidth * 100) / 100
    })
    
    // Ajustar para que la suma sea exactamente tableWidth (compensar errores de redondeo)
    const currentTotal = finalColWidths.reduce((sum, width) => sum + width, 0)
    const diff = tableWidth - currentTotal
    if (Math.abs(diff) > 0.001) {
      // Ajustar la columna más ancha (Ítem) para compensar la diferencia
      const itemIndex = 4
      finalColWidths[itemIndex] = finalColWidths[itemIndex] + diff
    }
    
    pdf.setFontSize(7)
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
    for (let i = 0; i < finalColWidths.length; i++) {
      pdf.line(xPos, headerY, xPos, headerY + headerHeight)
      xPos += finalColWidths[i]
    }
    // Línea final (borde derecho) - debe coincidir exactamente con el borde del rectángulo
    const finalX = 15 + tableWidth
    pdf.line(finalX, headerY, finalX, headerY + headerHeight)
    
    // Texto de encabezados (todos centrados)
    xPos = 15
    for (let i = 0; i < colHeaders.length; i++) {
      pdf.text(colHeaders[i], xPos + finalColWidths[i] / 2, yPosition, { align: 'center' })
      xPos += finalColWidths[i]
    }

    yPosition += 8

    // Datos de la tabla (solo bordes izquierdo y derecho)
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setDrawColor(200, 200, 200) // Color de borde gris

    // Dibujar borde izquierdo y derecho de la tabla
    let tableStartY = yPosition - 3
    let tableEndY = yPosition - 3

    const origenLabelsShort: Record<string, string> = {
      'registro_manual': 'Manual',
      'cotizacion_aprobada': 'Cot. Aprob.',
      'cotizacion_rechazada': 'Cot. Rech.',
      'cotizacion_editada': 'Cot. Edit.',
      'cotizacion_eliminada': 'Cot. Elim.'
    }

    for (const entry of dataConUsuario || []) {
      // Nueva página si es necesario
      if (yPosition > pageHeight - 20) {
        // Dibujar bordes de la sección anterior antes de cambiar de página
        pdf.line(15, tableStartY, 15, tableEndY) // Borde izquierdo
        pdf.line(15 + tableWidth, tableStartY, 15 + tableWidth, tableEndY) // Borde derecho
        
        pdf.addPage()
        yPosition = 20
        
        // Reimprimir encabezado
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.setFillColor(240, 240, 240)
        pdf.setDrawColor(200, 200, 200)
        pdf.setTextColor(0, 0, 0)
        
        const headerY = yPosition - 5
        pdf.rect(15, headerY, tableWidth, 8, 'FD')
        
        // Líneas verticales del encabezado
        let xPos = 15
        for (let i = 0; i < finalColWidths.length; i++) {
          pdf.line(xPos, headerY, xPos, headerY + 8)
          xPos += finalColWidths[i]
        }
        // Línea final (borde derecho) - debe coincidir exactamente con el borde del rectángulo
        const finalX = 15 + tableWidth
        pdf.line(finalX, headerY, finalX, headerY + 8)
        
        // Texto de encabezados
        xPos = 15
        for (let i = 0; i < colHeaders.length; i++) {
          pdf.text(colHeaders[i], xPos + finalColWidths[i] / 2, yPosition, { align: 'center' })
          xPos += finalColWidths[i]
        }
        
        yPosition += 8
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        
        // Reiniciar posición de inicio de tabla para nueva página
        tableStartY = yPosition - 3
        tableEndY = yPosition - 3
      }

      // Formatear datos
      let fechaFormateada = entry.fecha
      try {
        const date = new Date(entry.fecha)
        fechaFormateada = date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {}

      const origenLabel = origenLabelsShort[entry.origen] || entry.origen
      const itemNombre = entry.item_nombre || ''
      // En landscape tenemos más espacio, permitir más caracteres
      const itemNombreTruncado = itemNombre.length > 30 ? itemNombre.substring(0, 27) + '...' : itemNombre
      
      let cantidadTexto = `${formatearNumero(parseFloat(entry.cantidad_udm || 0))} ${entry.unidad_medida || ''}`
      if (
        entry.origen === 'registro_manual' && 
        entry.formato && 
        typeof entry.formato === 'object' && 
        entry.formato.cantidad_formato && 
        entry.formato.formato_seleccionado
      ) {
        cantidadTexto = `${entry.formato.cantidad_formato} ${entry.formato.formato_seleccionado}`
      }

      const impactoTexto = parseFloat(entry.impacto || 0) >= 0 ? `+${formatearNumero(Math.abs(parseFloat(entry.impacto || 0)))}` : `-${formatearNumero(Math.abs(parseFloat(entry.impacto || 0)))}`
      const observaciones = entry.observaciones ? (entry.observaciones.length > 15 ? entry.observaciones.substring(0, 12) + '...' : entry.observaciones) : ''

      // Escribir fila (todas las columnas del historial)
      const rowData = [
        fechaFormateada,
        origenLabel,
        entry.item_tipo || '',
        entry.item_codigo || '',
        itemNombreTruncado,
        entry.sucursal || '',
        cantidadTexto,
        impactoTexto,
        formatearNumero(parseFloat(entry.stock_anterior || 0)),
        formatearNumero(parseFloat(entry.stock_nuevo || 0)),
        entry.tipo_movimiento || '',
        entry.referencia_codigo || '',
        entry.usuario_nombre || ''
      ]

      xPos = 15
      for (let i = 0; i < rowData.length; i++) {
        const cellText = rowData[i].toString()
        const maxWidth = finalColWidths[i] - 2
        // Todas las columnas centradas
        pdf.text(cellText, xPos + finalColWidths[i] / 2, yPosition, { maxWidth, align: 'center' })
        xPos += finalColWidths[i]
      }

      tableEndY = yPosition + 2
      yPosition += 5
    }
    
    // Dibujar bordes izquierdo y derecho al final de la tabla
    pdf.line(15, tableStartY, 15, tableEndY) // Borde izquierdo
    pdf.line(15 + tableWidth, tableStartY, 15 + tableWidth, tableEndY) // Borde derecho

    // Footer (igual que catálogo de soportes y cotizaciones)
    const totalPages = pdf.getNumberOfPages()
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
      
      // Distribuir el footer con separadores (igual que en cotización)
      // Izquierda: 2025 Publicidad Vial Imagen
      const leftText = `${currentYear} Publicidad Vial Imagen`
      pdf.text(leftText, 5, footerY + 7)
      
      // Separador 1 (después del texto izquierdo)
      const leftTextWidth = pdf.getTextWidth(leftText)
      const separator1X = 5 + leftTextWidth + 5
      pdf.text('|', separator1X, footerY + 7)
      
      // Calcular espacio para el contenido derecho (email, número, paginación)
      const emailFooter = obtenerEmailFooter(userEmail)
      let rightContentWidth = 0
      if (emailFooter && emailFooter.trim() !== '') {
        rightContentWidth += pdf.getTextWidth(emailFooter) + 5
        if (userNumero && userNumero.trim() !== '') {
          rightContentWidth += 5 + pdf.getTextWidth('|') + 5 // Separador entre email y número
        }
      }
      if (userNumero && userNumero.trim() !== '') {
        rightContentWidth += pdf.getTextWidth(userNumero) + 5
      }
      const paginationText = `${i}/${totalPages}`
      rightContentWidth += pdf.getTextWidth(paginationText) + 5
      if ((emailFooter && emailFooter.trim() !== '') || (userNumero && userNumero.trim() !== '')) {
        rightContentWidth += 5 + pdf.getTextWidth('|') // Separador final antes de paginación
      }
      
      // Separador 2 (antes del contenido derecho) - incluyendo espacio para el separador mismo
      const separatorWidth = pdf.getTextWidth('|')
      const separator2X = pageWidth - 5 - rightContentWidth - separatorWidth
      pdf.text('|', separator2X, footerY + 7)
      
      // Centro: publicidadvialimagen.com (centrado entre los dos separadores)
      const webText = 'publicidadvialimagen.com'
      const centerX = (separator1X + separator2X) / 2
      pdf.text(webText, centerX, footerY + 7, { align: 'center' })
      
      // Derecha (antes de la paginación): email y número (si existen)
      let rightContentX = separator2X + 5
      if (emailFooter && emailFooter.trim() !== '') {
        pdf.text(emailFooter, rightContentX, footerY + 7)
        rightContentX += pdf.getTextWidth(emailFooter) + 5
        
        // Separador entre email y número
        if (userNumero && userNumero.trim() !== '') {
          pdf.text('|', rightContentX, footerY + 7)
          rightContentX += 5
        }
      }
      
      // Número de teléfono (si existe)
      if (userNumero && userNumero.trim() !== '') {
        pdf.text(userNumero, rightContentX, footerY + 7)
        rightContentX += pdf.getTextWidth(userNumero) + 5
      }
      
      // Separador final (antes de paginación) si hay email o número
      if ((emailFooter && emailFooter.trim() !== '') || (userNumero && userNumero.trim() !== '')) {
        pdf.text('|', rightContentX, footerY + 7)
      }
      
      // Extremo derecho: Paginación
      pdf.text(paginationText, pageWidth - 5, footerY + 7, { align: 'right' })
    }

    // Generar buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Generar nombre del archivo
    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, '0')
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const año = hoy.getFullYear()
    const nombreArchivo = `historial_stock_${dia}-${mes}-${año}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error) {
    console.error('❌ Error en GET /api/inventario/historial/export/pdf:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al exportar PDF'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
