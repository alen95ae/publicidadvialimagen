export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server"
import { getProductoById } from "@/lib/supabaseProductos"
import { todayBolivia } from "@/lib/utils"
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

/**
 * Función para normalizar el nombre del archivo eliminando acentos y caracteres especiales
 * Mantiene espacios y guiones para legibilidad
 */
function normalizeFileName(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .replace(/[áàäâãÁÀÄÂÃ]/g, 'a')
    .replace(/[éèëêÉÈËÊ]/g, 'e')
    .replace(/[íìïîÍÌÏÎ]/g, 'i')
    .replace(/[óòöôõÓÒÖÔÕ]/g, 'o')
    .replace(/[úùüûÚÙÜÛ]/g, 'u')
    .replace(/[ñÑ]/g, 'n')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-zA-Z0-9\s\-_\.]/g, '') // Mantener letras, números, espacios, guiones, guiones bajos y puntos
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim()
}

/**
 * Construye el nombre del archivo PDF según los filtros y selección
 */
function buildPDFFileName({
  producto,
  categoria,
}: {
  producto?: string;
  categoria?: string;
}): string {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, "0")}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}-${hoy.getFullYear()}`;

  // Opción 1: Un solo producto seleccionado
  if (producto) {
    return `${producto} - ${fecha}.pdf`;
  }

  // Opción 2: Categoría seleccionada
  if (categoria) {
    return `Catalogo de ${categoria} - ${fecha}.pdf`;
  }

  // Opción 3: Catálogo general
  return `Catalogo de productos - ${fecha}.pdf`;
}

/**
 * Función para cargar una imagen desde URL
 */
async function loadImage(imageUrl: string): Promise<{ base64: string | null; format: string }> {
  if (!imageUrl) {
    return { base64: null, format: 'JPEG' }
  }

  // Si ya es base64, retornarla
  if (imageUrl.startsWith('data:')) {
    return { base64: imageUrl, format: 'JPEG' }
  }

  // Si es una URL externa, cargarla
  try {
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error(`URL inválida: ${imageUrl}`)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PublicidadVialImagen/1.0)',
        'Accept': 'image/*'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const imageBuffer = await response.arrayBuffer()
    if (imageBuffer.byteLength === 0) {
      throw new Error('Imagen vacía recibida')
    }

    const buffer = Buffer.from(imageBuffer)

    // Detectar formato
    const contentType = response.headers.get('content-type') || ''
    let format = 'JPEG'
    let isPNG = false
    let isWEBP = false
    
    if (contentType.includes('png')) {
      format = 'PNG'
      isPNG = true
    } else if (contentType.includes('webp')) {
      format = 'WEBP'
      isWEBP = true
    }

    // Optimización conservadora: comprimir imágenes grandes manteniendo calidad visual
    try {
      const canvasModule = await import('canvas')
      const { createCanvas, loadImage: canvasLoadImage } = canvasModule
      
      // Cargar imagen en canvas
      const img = await canvasLoadImage(buffer)
      let imgCanvas = createCanvas(img.width, img.height)
      const imgCtx = imgCanvas.getContext('2d')
      imgCtx.drawImage(img, 0, 0)
      
      // Verificar si PNG tiene transparencia real (canal alfa usado)
      let hasAlpha = false
      if (isPNG) {
        const imageData = imgCtx.getImageData(0, 0, img.width, img.height)
        const data = imageData.data
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            hasAlpha = true
            break
          }
        }
      }
      
      // Reducir tamaño: limitar dimensión máxima (en el PDF se muestran pequeñas)
      const maxDimension = 800
      if (img.width > maxDimension || img.height > maxDimension) {
        const ratio = Math.min(maxDimension / img.width, maxDimension / img.height)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const resized = createCanvas(w, h)
        resized.getContext('2d').drawImage(img, 0, 0, w, h)
        imgCanvas = resized
      }
      
      // Compresión agresiva para reducir peso del PDF (catálogo para email)
      if (isPNG && !hasAlpha) {
        const compressedBuffer = imgCanvas.toBuffer('image/jpeg', { 
          quality: 0.72, 
          progressive: true,
          chromaSubsampling: true 
        })
        return {
          base64: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
          format: 'JPEG'
        }
      } else if (format === 'JPEG' || isWEBP) {
        const compressedBuffer = imgCanvas.toBuffer('image/jpeg', { 
          quality: 0.72, 
          progressive: true,
          chromaSubsampling: true 
        })
        return {
          base64: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
          format: 'JPEG'
        }
      } else {
        // PNG con transparencia → mantener sin comprimir
        return {
          base64: `data:image/${format.toLowerCase()};base64,${buffer.toString('base64')}`,
          format
        }
      }
    } catch (compressionError) {
      // Si falla la compresión, retornar imagen original sin comprimir
      console.error('No se pudo comprimir imagen, usando original:', compressionError)
      return {
        base64: `data:image/${format.toLowerCase()};base64,${buffer.toString('base64')}`,
        format
      }
    }
  } catch (error) {
    console.error('❌ Error cargando imagen del producto:', error instanceof Error ? error.message : error)
    console.error('   URL:', imageUrl.substring(0, 150))
    return { base64: null, format: 'JPEG' }
  }
}

// Función para obtener el email a mostrar en el footer
// Si el email pertenece a ciertos usuarios, se muestra el email comercial
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

async function generatePDF(productos: any[], userEmail?: string, userNumero?: string): Promise<Buffer> {
  try {
    // Obtener el email a mostrar en el footer
    const emailFooter = obtenerEmailFooter(userEmail)
    console.log('📄 Generando PDF catálogo de productos con email:', emailFooter, 'y número:', userNumero)
    const currentDate = todayBolivia()
    const currentYear = new Date().getFullYear()
    // Formato cuadrado 210x210mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 210] // Formato cuadrado
    })
    
    // Configuración de colores
    const primaryColor: [number, number, number] = [190, 8, 18] // #be0812 (mismo rojo que cotización)
    
    let yPosition = 20

    // Cargar el logo para la marca de agua y header (una sola vez)
    let logoBase64Watermark: string | null = null
    let logoBase64Header: string | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
      const logoBuffer = fs.readFileSync(logoPath)
      const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
      logoBase64Watermark = logoBase64
      logoBase64Header = logoBase64
    } catch (error) {
      // Logo no disponible, continuar sin marca de agua
    }

    // Pre-procesar todas las imágenes en paralelo ANTES del loop
    console.log('🔄 Pre-procesando imágenes en paralelo...')

    const preprocessPromises = productos.map(async (producto) => {
      const processed: { image: { base64: string | null; format: string } | null } = {
        image: null
      }

      // Pre-cargar imagen en paralelo
      if (producto.imagen_portada) {
        processed.image = await loadImage(producto.imagen_portada)
      }

      return processed
    })

    const preprocessedData = await Promise.all(preprocessPromises)
    console.log('✅ Pre-procesamiento completado')

    // Agregar cada producto (una página por producto)
    for (let index = 0; index < productos.length; index++) {
      const producto = productos[index]
      // Nueva página para cada producto (excepto el primero)
      if (index > 0) {
        pdf.addPage()
      }
      
      yPosition = 10
      
      // Logo de la empresa (esquina superior izquierda)
      const addLogo = () => {
        try {
          if (logoBase64Header) {
            const aspectRatio = 24 / 5.5
            const maxHeight = 7.5
            const calculatedWidth = maxHeight * aspectRatio
            const logoWidth = Math.min(calculatedWidth, 35)
            const logoHeight = logoWidth / aspectRatio
            
            const logoX = 20
            const logoY = yPosition - 1
            
            pdf.addImage(logoBase64Header, 'JPEG', logoX, logoY, logoWidth, logoHeight)
            return true
          }
          
          // Fallback: intentar cargar sin comprimir
          const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
          const logoBuffer = fs.readFileSync(logoPath)
          const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
          
          const aspectRatio = 24 / 5.5
          const maxHeight = 7.5
          const calculatedWidth = maxHeight * aspectRatio
          const logoWidth = Math.min(calculatedWidth, 35)
          const logoHeight = logoWidth / aspectRatio
          
          const logoX = 20
          const logoY = yPosition - 1
          
          pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, logoHeight)
          return true
        } catch (error) {
          return false
        }
      }
      
      // Ejecutar la función del logo
      addLogo()
      
      // Título del producto (a la derecha del logo, en rojo y negrita) - Tamaño reducido
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      // Ajustar texto si es muy largo
      const nombreProducto = producto.nombre || 'Sin nombre'
      const nombreLines = pdf.splitTextToSize(nombreProducto, 120) // Ancho máximo de 120mm
      pdf.text(nombreLines, 70, yPosition + 5)
      
      // Ajustar yPosition según el número de líneas del título
      const lineHeight = 7 // Altura aproximada de cada línea
      yPosition += 10 + (nombreLines.length * lineHeight)
      
      // Imagen principal del producto (usar datos pre-procesados)
      const preprocessedImage = preprocessedData[index]?.image
      if (preprocessedImage && preprocessedImage.base64) {
        try {
          const imageX = 20
          const imageY = yPosition
          const imageWidth = 80 // Ancho para formato vertical
          const imageHeight = 80 // Mantener proporción cuadrada
          
          pdf.addImage(preprocessedImage.base64, preprocessedImage.format, imageX, imageY, imageWidth, imageHeight)
          
          // Agregar marca de agua sobre la imagen
          if (logoBase64Watermark) {
            pdf.saveGraphicsState()
            pdf.setGState(new pdf.GState({ opacity: 0.08 }))
            
            const aspectRatio = 24 / 5.5
            const watermarkWidth = 100
            const watermarkHeight = watermarkWidth / aspectRatio
            
            // Centrar sobre la imagen
            const imageCenterX = imageX + imageWidth / 2
            const imageCenterY = imageY + imageHeight / 2
            
            // Rotar 45 grados
            pdf.addImage(
              logoBase64Watermark,
              'JPEG',
              imageCenterX - watermarkWidth / 2,
              imageCenterY - watermarkHeight / 2,
              watermarkWidth,
              watermarkHeight,
              undefined,
              'NONE',
              45
            )
            
            pdf.restoreGraphicsState()
          }
        } catch (pdfError) {
          console.error('❌ Error agregando imagen al PDF:', pdfError)
        }
      }
      
      yPosition += 90 // Espacio después de la imagen
      
      // Línea separadora
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.line(20, yPosition, 190, yPosition)
      yPosition += 15
      
      // Tabla con información del producto (2 columnas)
      const tableX = 20
      const tableWidth = 170 // Ancho disponible en formato vertical
      const tableY = yPosition
      const colWidths = [85, 85] // 2 columnas
      const rowHeight = 12 // Altura de cada fila
      
      // Configurar estilos de tabla
      pdf.setLineWidth(0.2)
      pdf.setDrawColor(180, 180, 180)
      
      // Preparar datos para la tabla (2 columnas) - Sin código, responsable, coste ni mostrar_en_web
      const tableData = [
        [
          { label: 'Categoría:', value: producto.categoria || 'N/A' },
          { label: 'Unidad de medida:', value: producto.unidad_medida || 'N/A' }
        ],
        [
          { label: 'Precio de venta:', value: `${producto.precio_venta?.toLocaleString('es-ES', { maximumFractionDigits: 2 }) || 'N/A'} Bs` },
          { label: 'Disponibilidad:', value: producto.disponibilidad || 'N/A' }
        ]
      ]
      
      // Dibujar tabla con bordes
      for (let row = 0; row < tableData.length; row++) {
        let currentX = tableX
        
        for (let col = 0; col < 2; col++) {
          const cellX = currentX
          const cellY = tableY + row * rowHeight
          
          // Fondo blanco y borde
          pdf.setFillColor(255, 255, 255)
          pdf.setDrawColor(180, 180, 180)
          pdf.setLineWidth(0.2)
          pdf.rect(cellX, cellY, colWidths[col], rowHeight, 'FD')
          
          // Texto con label en negrita y value en normal
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(10)
          
          const cellData = tableData[row][col]
          const label = cellData.label
          const value = cellData.value
          
          // Ajustar texto si es muy largo
          const maxWidth = colWidths[col] - 4
          const textY = cellY + (rowHeight / 2) + 3
          const startX = cellX + 3
          
          // Escribir label en negrita
          pdf.setFont('helvetica', 'bold')
          const labelWidth = pdf.getTextWidth(label)
          pdf.text(label, startX, textY)
          
          // Escribir value en normal (con ajuste de texto si es necesario)
          pdf.setFont('helvetica', 'normal')
          const valueMaxWidth = maxWidth - labelWidth - 1
          const valueLines = pdf.splitTextToSize(value, valueMaxWidth)
          
          // Si el valor cabe en una línea, escribirlo en la misma línea
          if (valueLines.length === 1) {
            pdf.text(value, startX + labelWidth + 1, textY)
          } else {
            // Si necesita múltiples líneas, escribir la primera línea
            pdf.text(valueLines[0], startX + labelWidth + 1, textY)
          }
          
          currentX += colWidths[col]
        }
      }
      
      yPosition += tableData.length * rowHeight + 15
      
      // Descripción si está disponible y hay espacio
      if (producto.descripcion && yPosition < 190) {
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Descripción:', 20, yPosition)
        yPosition += 8
        pdf.setFont('helvetica', 'normal')
        const descLines = pdf.splitTextToSize(producto.descripcion, 170)
        pdf.text(descLines, 20, yPosition)
      }
    }
    
    // Agregar footers con paginación y marca de agua a todas las páginas
    const totalPages = pdf.getNumberOfPages()
    const pageHeight = 210 // Altura de página cuadrada
    const footerHeight = 12 // Altura del footer
    const footerY = pageHeight - footerHeight // Pegado al final de la página
    const pageWidth = 210 // Ancho de página cuadrada
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      // Fondo rojo del footer
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, pageWidth, 12, 'F')
      
      // Texto en blanco
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      
      // Distribuir el footer con separadores
      const leftText = `${currentYear} Publicidad Vial Imagen`
      pdf.text(leftText, 5, footerY + 7)
      
      // Separador 1
      const leftTextWidth = pdf.getTextWidth(leftText)
      const separator1X = 5 + leftTextWidth + 5
      pdf.text('|', separator1X, footerY + 7)
      
      // Calcular espacio para el contenido derecho
      const emailFooter = obtenerEmailFooter(userEmail)
      let rightContentWidth = 0
      if (emailFooter && emailFooter.trim() !== '') {
        rightContentWidth += pdf.getTextWidth(emailFooter) + 5
        if (userNumero && userNumero.trim() !== '') {
          rightContentWidth += 5 + pdf.getTextWidth('|') + 5
        }
      }
      if (userNumero && userNumero.trim() !== '') {
        rightContentWidth += pdf.getTextWidth(userNumero) + 5
      }
      const paginationText = `${i}/${totalPages}`
      rightContentWidth += pdf.getTextWidth(paginationText) + 5
      if ((emailFooter && emailFooter.trim() !== '') || (userNumero && userNumero.trim() !== '')) {
        rightContentWidth += 5 + pdf.getTextWidth('|')
      }
      
      // Separador 2
      const separatorWidth = pdf.getTextWidth('|')
      const separator2X = pageWidth - 5 - rightContentWidth - separatorWidth
      pdf.text('|', separator2X, footerY + 7)
      
      // Centro: publicidadvialimagen.com
      const webText = 'publicidadvialimagen.com'
      const centerX = (separator1X + separator2X) / 2
      pdf.text(webText, centerX, footerY + 7, { align: 'center' })
      
      // Derecha (antes de la paginación): email y número
      let rightContentX = separator2X + 5
      if (emailFooter && emailFooter.trim() !== '') {
        pdf.text(emailFooter, rightContentX, footerY + 7)
        rightContentX += pdf.getTextWidth(emailFooter) + 5
        
        if (userNumero && userNumero.trim() !== '') {
          pdf.text('|', rightContentX, footerY + 7)
          rightContentX += 5
        }
      }
      
      if (userNumero && userNumero.trim() !== '') {
        pdf.text(userNumero, rightContentX, footerY + 7)
        rightContentX += pdf.getTextWidth(userNumero) + 5
      }
      
      // Separador final (antes de paginación) si hay email o número
      if ((emailFooter && emailFooter.trim() !== '') || (userNumero && userNumero.trim() !== '')) {
        pdf.text('|', rightContentX, footerY + 7)
      }
      
      // Extremo derecho: Paginación
      pdf.text(`${i}/${totalPages}`, pageWidth - 5, footerY + 7, { align: 'right' })
    }
    
    return Buffer.from(pdf.output('arraybuffer'))
  } catch (error) {
    console.error('Error en generatePDF:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    
    // Obtener el email y número del parámetro de URL
    const userEmail = url.searchParams.get('email') || undefined
    const userNumero = url.searchParams.get('numero') || undefined
    
    // Obtener parámetros para el nombre del archivo
    const productoNombreEncoded = url.searchParams.get('producto') || undefined
    const productoNombre = productoNombreEncoded ? decodeURIComponent(productoNombreEncoded) : undefined
    const categoriaEncoded = url.searchParams.get('categoria') || undefined
    const categoria = categoriaEncoded ? decodeURIComponent(categoriaEncoded) : undefined
    
    if (!ids) {
      return NextResponse.json({ error: "IDs de productos requeridos" }, { status: 400 })
    }

    const productIds = ids.split(',')

    // Obtener los productos específicos
    const productos = []
    const productosSinImagen: string[] = []
    
    for (const id of productIds) {
      try {
        const producto = await getProductoById(id)
        if (producto) {
          // Validar que el producto tenga imagen
          if (!producto.imagen_portada) {
            productosSinImagen.push(producto.nombre || producto.codigo || id)
          } else {
            productos.push(producto)
          }
        }
      } catch (error) {
        console.error(`Error fetching product ${id}:`, error)
      }
    }

    if (productos.length === 0) {
      return NextResponse.json({ error: "No se encontraron productos" }, { status: 404 })
    }

    // Si hay productos sin imagen, retornar error específico
    if (productosSinImagen.length > 0) {
      const mensaje = productosSinImagen.length === 1
        ? `El producto "${productosSinImagen[0]}" no tiene imagen. Por favor, agrega una imagen antes de generar el catálogo.`
        : `Los siguientes productos no tienen imagen: ${productosSinImagen.join(', ')}. Por favor, agrega imágenes a estos productos antes de generar el catálogo.`
      return NextResponse.json({ 
        error: mensaje,
        productosSinImagen: productosSinImagen 
      }, { status: 400 })
    }

    // Generar PDF
    const pdf = await generatePDF(productos, userEmail, userNumero)
    
    // Construir nombre del archivo dinámico
    let fileName = buildPDFFileName({
      producto: productoNombre,
      categoria: categoria,
    })
    
    // Normalizar el nombre del archivo
    fileName = normalizeFileName(fileName)
    
    // Limpiar el nombre del archivo
    fileName = fileName.trim().replace(/[_\s]+$/, '').replace(/\s+/g, ' ')
    
    // Configurar headers para descarga con codificación correcta
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    const encodedFileName = encodeURIComponent(fileName)
    headers.set('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`)
    
    return new NextResponse(pdf, { headers })
  } catch (error) {
    console.error("Error generando PDF:", error)
    return NextResponse.json({ error: "Error al generar el catálogo" }, { status: 500 })
  }
}
