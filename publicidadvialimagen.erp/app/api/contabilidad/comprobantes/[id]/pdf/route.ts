import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
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

// Función para convertir números a letras en español
function numeroALetras(numero: number): string {
  if (numero === 0) return 'Cero'
  if (numero < 0) return 'Menos ' + numeroALetras(Math.abs(numero))

  let resultado = ''

  // Millones
  const millones = Math.floor(numero / 1000000)
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'Un Millón '
    } else {
      resultado += convertirGrupo(millones) + ' Millones '
    }
    numero = numero % 1000000
  }

  // Miles
  const miles = Math.floor(numero / 1000)
  if (miles > 0) {
    if (miles === 1) {
      resultado += 'Mil '
    } else {
      resultado += convertirGrupo(miles) + ' Mil '
    }
    numero = numero % 1000
  }

  // Centenas, decenas y unidades
  if (numero > 0) {
    resultado += convertirGrupo(numero)
  }

  return resultado.trim()
}

function convertirGrupo(numero: number): string {
  const unidades = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve']
  const decenas = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa']
  const especiales = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve']
  const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos']

  if (numero === 0) return ''
  if (numero === 100) return 'Cien'

  let resultado = ''

  // Centenas
  const centena = Math.floor(numero / 100)
  if (centena > 0) {
    resultado += centenas[centena] + ' '
    numero = numero % 100
  }

  // Decenas y unidades
  if (numero >= 10 && numero < 20) {
    resultado += especiales[numero - 10] + ' '
  } else {
    const decena = Math.floor(numero / 10)
    const unidad = numero % 10

    if (decena > 0) {
      resultado += decenas[decena]
      if (unidad > 0) {
        resultado += ' y '
      }
      resultado += unidades[unidad] + ' '
    } else if (unidad > 0) {
      resultado += unidades[unidad] + ' '
    }
  }

  return resultado.trim()
}

// GET - Generar PDF del comprobante
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    // Obtener comprobante con detalles y descripciones de cuentas
    const { data: comprobante, error: errorComprobante } = await supabase
      .from("comprobantes")
      .select("*")
      .eq("id", params.id)
      .eq("empresa_id", 1)
      .single()

    if (errorComprobante || !comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    // Solo permitir PDF si está APROBADO
    if (comprobante.estado !== "APROBADO") {
      return NextResponse.json(
        { error: "Solo se pueden exportar comprobantes aprobados" },
        { status: 400 }
      )
    }

    // Obtener detalles ordenados por orden
    const { data: detalles, error: errorDetalles } = await supabase
      .from("comprobante_detalle")
      .select("*")
      .eq("comprobante_id", params.id)
      .order("orden", { ascending: true })

    if (errorDetalles) {
      console.error("Error fetching detalles:", errorDetalles)
      return NextResponse.json(
        { error: "Error al obtener los detalles del comprobante" },
        { status: 500 }
      )
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: "El comprobante no tiene detalles" },
        { status: 400 }
      )
    }

    // Obtener descripciones de cuentas
    const cuentasCodigos = [...new Set(detalles.map((d: any) => d.cuenta))]
    const { data: cuentas, error: errorCuentas } = await supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion")
      .in("cuenta", cuentasCodigos)
      .eq("empresa_id", 1)

    if (errorCuentas) {
      console.error("Error fetching cuentas:", errorCuentas)
    }

    // Crear mapa de cuentas para búsqueda rápida
    const mapaCuentas = new Map<string, string>()
    if (cuentas) {
      cuentas.forEach((c: any) => {
        mapaCuentas.set(c.cuenta, c.descripcion || "")
      })
    }

    // Obtener información del usuario para el footer
    let userEmail: string | undefined
    let userNumero: string | undefined
    
    try {
      const supabaseUser = await getSupabaseUser(request)
      if (supabaseUser) {
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (user?.email) {
          userEmail = user.email
          // Obtener número del usuario desde la tabla usuarios
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

    // Generar PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const primaryColor: [number, number, number] = [190, 8, 18] // #be0812
    const currentYear = new Date().getFullYear()
    
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
    const pageWidth = 210
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Publicidad Vial Imagen S.R.L.', pageWidth - 15, yPosition + 1, { align: 'right' })
    
    pdf.setFont('helvetica', 'normal')
    pdf.text('C. Nicolás Acosta Esq. Pedro Blanco', pageWidth - 15, yPosition + 5, { align: 'right' })
    pdf.text('(Alto San Pedro) N° 1471', pageWidth - 15, yPosition + 9, { align: 'right' })
    pdf.text('La Paz', pageWidth - 15, yPosition + 13, { align: 'right' })

    yPosition = 30

    // Formatear tipo de comprobante: primera letra mayúscula, resto minúscula
    const tipoComprobante = comprobante.tipo_comprobante || "Diario"
    const tipoFormateado = tipoComprobante.charAt(0).toUpperCase() + tipoComprobante.slice(1).toLowerCase()
    
    // Comprobante de [Tipo] N° X centrado
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const comprobanteText = `Comprobante de ${tipoFormateado} N° ${comprobante.numero}`
    const comprobanteTextWidth = pdf.getTextWidth(comprobanteText)
    pdf.text(comprobanteText, (pageWidth - comprobanteTextWidth) / 2, yPosition)
    
    // Fecha alineada a la derecha
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const fechaFormateada = new Date(comprobante.fecha).toLocaleDateString('es-ES')
    pdf.text(`Fecha: ${fechaFormateada}`, pageWidth - 15, yPosition, { align: 'right' })

    yPosition += 12

    // Sección de datos
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    if (comprobante.beneficiario) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Beneficiario:', 15, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(comprobante.beneficiario, 50, yPosition)
      yPosition += 6
    }

    // NIT encima de Concepto
    pdf.setFont('helvetica', 'bold')
    pdf.text('NIT:', 15, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text('164692025', 50, yPosition)
    yPosition += 6

    if (comprobante.concepto) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Concepto:', 15, yPosition)
      pdf.setFont('helvetica', 'normal')
      // Dividir concepto en líneas si es muy larga
      const conceptoLines = pdf.splitTextToSize(comprobante.concepto, pageWidth - 60)
      pdf.text(conceptoLines, 50, yPosition)
      yPosition += conceptoLines.length * 5
    }

    pdf.setFont('helvetica', 'bold')
    pdf.text('Tipo de Cambio:', 15, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text('1$ USD = Bs 6.96', 50, yPosition)
    yPosition += 6

    if (comprobante.nro_cheque) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Nro. Cheque:', 15, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(comprobante.nro_cheque, 50, yPosition)
      yPosition += 6
    }

    yPosition += 5

    // Tabla de detalle
    const tableStartY = yPosition
    const tableWidth = pageWidth - 30
    // Calcular ancho de columnas numéricas (4 columnas iguales)
    const colWidths = {
      cuenta: 25,
      descripcion: 50,
      debeBs: (tableWidth - 25 - 50) / 4, // Ancho igual para las 4 columnas numéricas
      haberBs: (tableWidth - 25 - 50) / 4,
      debeUsd: (tableWidth - 25 - 50) / 4,
      haberUsd: (tableWidth - 25 - 50) / 4
    }

    // Encabezados de tabla (gris con letras negras y bordes)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.setFillColor(240, 240, 240)
    const headerY = yPosition - 5
    const headerHeight = 8
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(15, headerY, tableWidth, headerHeight, 'FD') // FD = Fill + Draw (bordes)
    
    // Líneas verticales para dividir columnas (incluyendo bordes izquierdo y derecho)
    let xPos = 15
    // Línea vertical izquierda (borde de la columna Cuenta)
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.cuenta
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.descripcion
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.debeBs
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.haberBs
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.debeUsd
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    xPos += colWidths.haberUsd
    // Línea vertical derecha (borde de la columna Haber USD)
    pdf.line(xPos, headerY, xPos, headerY + headerHeight)
    
    // Texto de encabezados (centrados en columnas numéricas)
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

    // Calcular totales
    let totalDebeBs = 0
    let totalHaberBs = 0
    let totalDebeUsd = 0
    let totalHaberUsd = 0

    // Filas de detalle
    for (const detalle of detalles) {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      const descripcion = mapaCuentas.get(detalle.cuenta) || ""
      const descripcionLines = pdf.splitTextToSize(descripcion, colWidths.descripcion - 4)
      
      // Obtener glosa del detalle si existe
      const glosa = detalle.glosa && String(detalle.glosa).trim() !== "" ? String(detalle.glosa).trim() : null
      const glosaLines = glosa ? pdf.splitTextToSize(glosa, colWidths.descripcion - 4) : []
      
      // Calcular altura de la fila: descripción + glosa (si existe)
      const descripcionHeight = descripcionLines.length * 5
      const glosaHeight = glosaLines.length > 0 ? glosaLines.length * 5 : 0 // Misma altura que la descripción
      const rowHeight = Math.max(6, descripcionHeight + glosaHeight)

      // Líneas verticales para dividir columnas en cada fila (incluyendo bordes)
      pdf.setDrawColor(200, 200, 200)
      xPos = 15
      // Línea vertical izquierda (borde de la columna Cuenta)
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.cuenta
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.descripcion
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.debeBs
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.haberBs
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.debeUsd
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)
      xPos += colWidths.haberUsd
      // Línea vertical derecha (borde de la columna Haber USD)
      pdf.line(xPos, yPosition - 5, xPos, yPosition - 5 + rowHeight)

      xPos = 15
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(detalle.cuenta, xPos + 2, yPosition)
      xPos += colWidths.cuenta
      
      // Mostrar descripción de la cuenta
      pdf.text(descripcionLines, xPos + 2, yPosition)
      
      // Si hay glosa, mostrarla debajo de la descripción (muy cerca, mismo tamaño)
      if (glosaLines.length > 0) {
        const glosaY = yPosition + descripcionHeight - 1 // -1mm para acercarla mucho más
        pdf.setFontSize(8) // Mismo tamaño que la descripción
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(100, 100, 100) // Gris para diferenciar la glosa
        pdf.text(glosaLines, xPos + 2, glosaY)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0) // Restaurar color negro
      }
      xPos += colWidths.descripcion
      
      // Centrar valores numéricos
      pdf.text(formatearNumero(detalle.debe_bs || 0), xPos + colWidths.debeBs / 2, yPosition, { align: 'center' })
      totalDebeBs += detalle.debe_bs || 0
      xPos += colWidths.debeBs
      
      pdf.text(formatearNumero(detalle.haber_bs || 0), xPos + colWidths.haberBs / 2, yPosition, { align: 'center' })
      totalHaberBs += detalle.haber_bs || 0
      xPos += colWidths.haberBs
      
      pdf.text(formatearNumero(detalle.debe_usd || 0), xPos + colWidths.debeUsd / 2, yPosition, { align: 'center' })
      totalDebeUsd += detalle.debe_usd || 0
      xPos += colWidths.debeUsd
      
      pdf.text(formatearNumero(detalle.haber_usd || 0), xPos + colWidths.haberUsd / 2, yPosition, { align: 'center' })
      totalHaberUsd += detalle.haber_usd || 0

      yPosition += rowHeight
    }

    yPosition += 3

    // Totales (granate con letras blancas y bordes)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    const totalY = yPosition - 5
    const totalHeight = 8
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(15, totalY, tableWidth, totalHeight, 'FD') // FD = Fill + Draw (bordes)
    pdf.setTextColor(255, 255, 255)
    
    // Líneas verticales para dividir columnas en totales (blancas para que se vean sobre el fondo granate)
    pdf.setDrawColor(255, 255, 255)
    xPos = 15
    // Línea vertical izquierda (borde de la columna Cuenta)
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.cuenta
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.descripcion
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.debeBs
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.haberBs
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.debeUsd
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    xPos += colWidths.haberUsd
    // Línea vertical derecha (borde de la columna Haber USD)
    pdf.line(xPos, totalY, xPos, totalY + totalHeight)
    
    xPos = 15 + colWidths.cuenta + colWidths.descripcion
    pdf.text('TOTALES', xPos - colWidths.descripcion + 2, yPosition)
    // Centrar valores numéricos en totales
    pdf.text(formatearNumero(totalDebeBs), xPos + colWidths.debeBs / 2, yPosition, { align: 'center' })
    xPos += colWidths.debeBs
    pdf.text(formatearNumero(totalHaberBs), xPos + colWidths.haberBs / 2, yPosition, { align: 'center' })
    xPos += colWidths.haberBs
    pdf.text(formatearNumero(totalDebeUsd), xPos + colWidths.debeUsd / 2, yPosition, { align: 'center' })
    xPos += colWidths.debeUsd
    pdf.text(formatearNumero(totalHaberUsd), xPos + colWidths.haberUsd / 2, yPosition, { align: 'center' })
    
    // Restaurar color de texto para el resto del documento
    pdf.setTextColor(0, 0, 0)

    yPosition += 10

    // Son: (con el mismo estilo que Concepto)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Son:', 15, yPosition)
    pdf.setFont('helvetica', 'normal')
    
    // Convertir totalDebeBs a letras
    const parteEntera = Math.floor(totalDebeBs)
    const centavos = Math.round((totalDebeBs - parteEntera) * 100)
    const centavosStr = centavos.toString().padStart(2, '0')
    const numeroEnLetras = numeroALetras(parteEntera)
    const textoCompleto = `${numeroEnLetras} ${centavosStr}/100 Bolivianos`
    
    // Dividir el texto en líneas si es muy largo (más cerca de Son:)
    const sonLines = pdf.splitTextToSize(textoCompleto, pageWidth - 50)
    pdf.text(sonLines, 40, yPosition)
    yPosition += sonLines.length * 5

    yPosition += 5

    // Firmas
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const firmaY = yPosition
    const firmaWidth = (pageWidth - 30) / 4
    const firmaStartX = 15
    const firmaLineSpacing = 3 // Espacio entre texto y línea

    // Elaborado por
    pdf.text('Elaborado por', firmaStartX, firmaY)
    const elaboradoTextWidth = pdf.getTextWidth('Elaborado por')
    pdf.setDrawColor(0, 0, 0)
    pdf.line(firmaStartX, firmaY + firmaLineSpacing, firmaStartX + elaboradoTextWidth, firmaY + firmaLineSpacing)
    
    // Revisado por
    pdf.text('Revisado por', firmaStartX + firmaWidth, firmaY)
    const revisadoTextWidth = pdf.getTextWidth('Revisado por')
    pdf.line(firmaStartX + firmaWidth, firmaY + firmaLineSpacing, firmaStartX + firmaWidth + revisadoTextWidth, firmaY + firmaLineSpacing)
    
    // Autorizado por
    pdf.text('Autorizado por', firmaStartX + firmaWidth * 2, firmaY)
    const autorizadoTextWidth = pdf.getTextWidth('Autorizado por')
    pdf.line(firmaStartX + firmaWidth * 2, firmaY + firmaLineSpacing, firmaStartX + firmaWidth * 2 + autorizadoTextWidth, firmaY + firmaLineSpacing)
    
    // Recibí conforme
    pdf.text('Recibí conforme', firmaStartX + firmaWidth * 3, firmaY)
    const recibidoTextWidth = pdf.getTextWidth('Recibí conforme')
    pdf.line(firmaStartX + firmaWidth * 3, firmaY + firmaLineSpacing, firmaStartX + firmaWidth * 3 + recibidoTextWidth, firmaY + firmaLineSpacing)

    // Footer (reutilizando el mismo del PDF de cotización)
    const totalPages = pdf.getNumberOfPages()
    const pageHeight = 297
    const footerHeight = 12
    const footerY = pageHeight - footerHeight

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      // Fondo rojo del footer
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
      
      // Paginación (sin separador antes)
      const paginationX = pageWidth - 15
      pdf.text(paginationText, paginationX, footerTextY, { align: 'right' })
    }

    // Generar nombre del archivo
    const nombreArchivo = `comprobante_${comprobante.tipo_comprobante}_${comprobante.numero}.pdf`

    // Devolver PDF como buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    )
  }
}

