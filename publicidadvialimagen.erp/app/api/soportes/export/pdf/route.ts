export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server"
import { getSoporteById } from "@/lib/supabaseSoportes"
import { getProductoById } from "@/lib/supabaseProductos"
import { rowToSupport, getSustratoDefaultId } from "../../helpers"
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

/**
 * Función para crear slug SEO-friendly (igual que en la web)
 */
function createSlug(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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
 * Función para generar URL del soporte en la web pública
 */
function getSoporteWebUrl(soporteTitle: string, soporteId?: string, soporteCode?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://publicidadvialimagen.com'
  const slug = createSlug(soporteTitle)
  
  // Si hay slug, usarlo; si no, usar el ID o código como fallback
  if (slug) {
    return `${baseUrl}/vallas-publicitarias/${slug}`
  } else if (soporteId && soporteId.trim() !== '') {
    return `${baseUrl}/vallas-publicitarias/${soporteId}`
  } else if (soporteCode && soporteCode.trim() !== '') {
    return `${baseUrl}/vallas-publicitarias/${soporteCode}`
  }
  
  return `${baseUrl}/vallas-publicitarias`
}

/**
 * Función para cargar imagen desde URL (sin compresión)
 * Retorna la URL directamente o la convierte a base64 si es necesario
 */
async function loadImage(imageUrl: string): Promise<string | null> {
  if (!imageUrl) {
    return null
  }

  // Si ya es base64, retornarla directamente
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }

  // Si es una URL externa, intentar cargarla y convertirla a base64
  try {
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.error(`URL inválida: ${imageUrl}`)
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PublicidadVialImagen/1.0)',
        'Accept': 'image/*'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Error cargando imagen: HTTP ${response.status}`)
      return null
    }

    const imageBuffer = await response.arrayBuffer()
    if (imageBuffer.byteLength === 0) {
      console.error('Imagen vacía recibida')
      return null
    }

    // Detectar formato
    const contentType = response.headers.get('content-type') || ''
    let format = 'JPEG'
    if (contentType.includes('png')) {
      format = 'PNG'
    } else if (contentType.includes('webp')) {
      format = 'WEBP'
    }

    const base64 = Buffer.from(imageBuffer).toString('base64')
    return `data:image/${format.toLowerCase()};base64,${base64}`
  } catch (error) {
    console.error('Error cargando imagen:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Construye el nombre del archivo PDF según los filtros y selección
 */
function buildPDFFileName({
  disponibilidad,
  ciudad,
  soporte,
}: {
  disponibilidad?: string; // "disponibles" | "ocupados"
  ciudad?: string;
  soporte?: string;
}): string {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, "0")}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}-${hoy.getFullYear()}`;

  // Opción 4: Un solo soporte seleccionado
  if (soporte) {
    return `${soporte} - ${fecha}.pdf`;
  }

  // Opción 1: disponibilidad + ciudad
  if (disponibilidad && ciudad) {
    const dispUpper =
      disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
    return `${dispUpper} - ${ciudad} - ${fecha}.pdf`;
  }

  // Opción 2: solo disponibilidad
  if (disponibilidad) {
    const dispUpper =
      disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
    return `${dispUpper} - ${fecha}.pdf`;
  }

  // Opción 3: solo ciudad
  if (ciudad) {
    return `${ciudad} - ${fecha}.pdf`;
  }

  // Opción 5: nada seleccionado
  return `Catalogo Vallas Publicitarias - ${fecha}.pdf`;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    
    // Obtener el email y número del parámetro de URL (igual que en cotizaciones)
    const userEmail = url.searchParams.get('email') || undefined
    const userNumero = url.searchParams.get('numero') || undefined
    
    // Obtener parámetros para el nombre del archivo
    const disponibilidad = url.searchParams.get('disponibilidad') || undefined
    const ciudad = url.searchParams.get('ciudad') || undefined
    const soporteTituloEncoded = url.searchParams.get('soporte') || undefined
    // Decodificar el título del soporte si viene codificado
    const soporteTitulo = soporteTituloEncoded ? decodeURIComponent(soporteTituloEncoded) : undefined
    
    if (!ids) {
      return NextResponse.json({ error: "IDs de soportes requeridos" }, { status: 400 })
    }

    const supportIds = ids.split(',')

    // Obtener los soportes específicos
    const supports = []
    for (const id of supportIds) {
      try {
        const record = await getSoporteById(id)
        if (record) {
          // getSoporteById devuelve un Soporte directamente, no con .fields
          const support = rowToSupport({
            id: record.id,
            ...record
          })
          
          // Cargar producto sustrato si existe, o usar el por defecto
          let sustratoId = record.sustrato
          if (!sustratoId) {
            // Si no hay sustrato, usar el por defecto
            sustratoId = await getSustratoDefaultId()
          }
          
          if (sustratoId) {
            try {
              const producto = await getProductoById(sustratoId)
              support.sustrato_precio_venta = producto.precio_venta || 0
              support.sustrato_nombre = `${producto.codigo} - ${producto.nombre}`
            } catch (error) {
              console.error(`Error cargando producto sustrato ${sustratoId}:`, error)
              support.sustrato_precio_venta = 0
              support.sustrato_nombre = 'LONA 13 Oz + IMPRESIÓN'
            }
          } else {
            support.sustrato_precio_venta = 0
            support.sustrato_nombre = 'LONA 13 Oz + IMPRESIÓN'
          }
          
          supports.push(support)
        }
      } catch (error) {
        console.error(`Error fetching support ${id}:`, error)
      }
    }

    if (supports.length === 0) {
      return NextResponse.json({ error: "No se encontraron soportes" }, { status: 404 })
    }

    // Generar PDF
    const pdf = await generatePDF(supports, userEmail, userNumero)
    
    // Construir nombre del archivo dinámico
    let fileName = buildPDFFileName({
      disponibilidad,
      ciudad,
      soporte: soporteTitulo,
    })
    
    // Normalizar el nombre del archivo: eliminar acentos y caracteres especiales
    fileName = normalizeFileName(fileName)
    
    // Limpiar el nombre del archivo: eliminar espacios y caracteres extra al final
    fileName = fileName.trim().replace(/[_\s]+$/, '').replace(/\s+/g, ' ')
    
    // Configurar headers para descarga con codificación correcta
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    // Usar encodeURIComponent para caracteres especiales y también proporcionar versión ASCII
    const encodedFileName = encodeURIComponent(fileName)
    headers.set('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`)
    
    return new NextResponse(pdf, { headers })
  } catch (error) {
    console.error("Error generando PDF:", error)
    return NextResponse.json({ error: "Error al generar el catálogo" }, { status: 500 })
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

async function generatePDF(supports: any[], userEmail?: string, userNumero?: string): Promise<Buffer> {
  try {
    // Obtener el email a mostrar en el footer
    const emailFooter = obtenerEmailFooter(userEmail)
    console.log('📄 Generando PDF catálogo con email:', emailFooter, 'y número:', userNumero)
    const currentDate = new Date().toLocaleDateString('es-ES')
    const currentYear = new Date().getFullYear()
    const pdf = new jsPDF('l', 'mm', 'a4') // Cambio a landscape (horizontal)
    
    // Configuración de colores
    const primaryColor: [number, number, number] = [190, 8, 18] // #be0812 (mismo rojo que cotización)
    
    let yPosition = 20

    // Función para obtener colores del estado (igual que en la web)
    const getStatusColors = (status: string) => {
      switch (status) {
        case 'Disponible':
          return { bg: [220, 252, 231], text: [22, 101, 52] } // green-100, green-800
        case 'Reservado':
          return { bg: [254, 249, 195], text: [133, 77, 14] } // yellow-100, yellow-800
        case 'Ocupado':
          return { bg: [254, 226, 226], text: [153, 27, 27] } // red-100, red-800
        case 'No disponible':
          return { bg: [243, 244, 246], text: [55, 65, 81] } // gray-100, gray-800
        case 'A Consultar':
          return { bg: [219, 234, 254], text: [30, 64, 175] } // blue-100, blue-800
        default:
          return { bg: [243, 244, 246], text: [55, 65, 81] } // gray-100, gray-800
      }
    }

    // Cargar el logo para la marca de agua y header (una sola vez - SIN compresión)
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

    // Pre-cargar todas las imágenes en paralelo ANTES del loop
    console.log('🔄 Pre-cargando imágenes...')
    
    const preprocessPromises = supports.map(async (support) => {
      const processed: { image: string | null } = {
        image: null
      }

      // Pre-cargar imagen en paralelo (sin compresión, sin mapas)
      if (support.images && support.images.length > 0) {
        processed.image = await loadImage(support.images[0])
      }

      return processed
    })

    const preprocessedData = await Promise.all(preprocessPromises)
    console.log('✅ Pre-carga completada')

    // Agregar cada soporte (una página por soporte)
    for (let index = 0; index < supports.length; index++) {
      const support = supports[index]
      // Nueva página para cada soporte (excepto el primero)
      if (index > 0) {
        pdf.addPage()
      }
      
      yPosition = 10
      
      // Logo de la empresa (esquina superior izquierda)
      const addLogo = () => {
        try {
          // Usar el logo que ya se cargó antes del loop
          if (logoBase64Header) {
            // Proporciones exactas 24x5.5 (aspectRatio = 24/5.5 ≈ 4.36) - Tamaño reducido a la mitad
            const aspectRatio = 24 / 5.5
            const maxHeight = 7.5 // Altura reducida a la mitad (15/2)
            const calculatedWidth = maxHeight * aspectRatio
            const logoWidth = Math.min(calculatedWidth, 35) // Ancho reducido a la mitad (70/2)
            const logoHeight = logoWidth / aspectRatio // Altura calculada para mantener proporción exacta
            
            const logoX = 20 // Posición a la izquierda del título
            const logoY = yPosition - 1
            
            pdf.addImage(logoBase64Header, 'JPEG', logoX, logoY, logoWidth, logoHeight)
            return true
          }
          return false
        } catch (error) {
          console.error('Error agregando logo:', error)
          return false
        }
      }
      
      // Ejecutar la función del logo
      addLogo()
      
      // Título del soporte (a la derecha del logo, en rojo y negrita)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(support.title, 70, yPosition + 5) // Movido a la derecha del logo (20 + 35 + 15 de margen)
      
      yPosition += 20
      
      // Imagen principal del soporte (usar datos pre-cargados)
      const preprocessedImage = preprocessedData[index]?.image
      if (preprocessedImage) {
        try {
          const imageX = 15
          const imageY = yPosition
          const imageWidth = 130
          const imageHeight = 90
          
          // Detectar formato de la imagen
          let imageFormat = 'JPEG'
          if (preprocessedImage.includes('data:image/png')) {
            imageFormat = 'PNG'
          } else if (preprocessedImage.includes('data:image/webp')) {
            imageFormat = 'WEBP'
          }
          
          pdf.addImage(preprocessedImage, imageFormat, imageX, imageY, imageWidth, imageHeight)
          
          // Agregar marca de agua sobre la imagen
          if (logoBase64Watermark) {
            pdf.saveGraphicsState()
            pdf.setGState(new pdf.GState({ opacity: 0.08 }))
            
            const aspectRatio = 24 / 5.5
            const watermarkWidth = 120
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
          
          // Agregar indicador de que es clickeable (debajo de la imagen)
          pdf.setTextColor(0, 0, 255) // Azul para indicar enlace
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.text('Clic para abrir en página web', imageX + imageWidth/2, imageY + imageHeight + 3, { align: 'center' })
          
          // Hacer la imagen clickeable
          const webUrl = getSoporteWebUrl(support.title, support.id, support.code)
          pdf.link(imageX, imageY, imageWidth, imageHeight, { url: webUrl })
        } catch (pdfError) {
          console.error('Error agregando imagen al PDF:', pdfError)
        }
      }
      
      // PLACEHOLDER para mapa (lado derecho) - sin generar mapa real
      if (support.latitude && support.longitude) {
        try {
          const mapWidth = 130
          const mapHeight = 90
          const mapX = 155
          const mapY = yPosition
          
          // Dibujar rectángulo gris como placeholder
          pdf.setFillColor(240, 240, 240)
          pdf.rect(mapX, mapY, mapWidth, mapHeight, 'F')
          
          // Texto de placeholder
          pdf.setTextColor(150, 150, 150)
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          pdf.text('Mapa no disponible', mapX + mapWidth/2, mapY + mapHeight/2 - 5, { align: 'center' })
          
          // Mostrar coordenadas
          pdf.setFontSize(8)
          pdf.text(`Lat: ${support.latitude}`, mapX + mapWidth/2, mapY + mapHeight/2 + 5, { align: 'center' })
          pdf.text(`Lng: ${support.longitude}`, mapX + mapWidth/2, mapY + mapHeight/2 + 10, { align: 'center' })
          
          // Agregar marca de agua sobre el placeholder del mapa
          if (logoBase64Watermark) {
            pdf.saveGraphicsState()
            pdf.setGState(new pdf.GState({ opacity: 0.08 }))
            
            const aspectRatio = 24 / 5.5
            const watermarkWidth = 120
            const watermarkHeight = watermarkWidth / aspectRatio
            
            const mapCenterX = mapX + mapWidth / 2
            const mapCenterY = mapY + mapHeight / 2
            
            pdf.addImage(
              logoBase64Watermark,
              'JPEG',
              mapCenterX - watermarkWidth / 2,
              mapCenterY - watermarkHeight / 2,
              watermarkWidth,
              watermarkHeight,
              undefined,
              'NONE',
              45
            )
            
            pdf.restoreGraphicsState()
          }
        } catch (mapError) {
          console.error('Error agregando placeholder de mapa:', mapError)
        }
      }
      
      yPosition += 100
      
      // Sección de información del soporte (4 columnas)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      // Primera fila
      const col1X = 15
      const col2X = 85
      const col3X = 155
      const col4X = 225
      
      // Código
      pdf.setFont('helvetica', 'bold')
      pdf.text('Código:', col1X, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(support.code || 'N/A', col1X + 15, yPosition)
      
      // Ubicación
      pdf.setFont('helvetica', 'bold')
      pdf.text('Ubicación:', col2X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const ubicacionText = support.ubicacion || 'N/A'
      const maxWidth = 60
      const ubicacionLines = pdf.splitTextToSize(ubicacionText, maxWidth)
      pdf.text(ubicacionLines[0], col2X + 20, yPosition)
      
      // Ciudad
      pdf.setFont('helvetica', 'bold')
      pdf.text('Ciudad:', col3X, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(support.ciudad || 'N/A', col3X + 15, yPosition)
      
      // Estado
      pdf.setFont('helvetica', 'bold')
      pdf.text('Estado:', col4X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const estado = support.estado || 'N/A'
      const statusColors = getStatusColors(estado)
      
      // Dibujar badge de estado
      const badgeX = col4X + 15
      const badgeY = yPosition - 3
      const badgeWidth = 28
      const badgeHeight = 5
      
      pdf.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2])
      pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F')
      
      pdf.setTextColor(statusColors.text[0], statusColors.text[1], statusColors.text[2])
      pdf.setFontSize(8)
      pdf.text(estado, badgeX + badgeWidth/2, yPosition, { align: 'center' })
      
      yPosition += 8
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      
      // Segunda fila
      // Propietario
      pdf.setFont('helvetica', 'bold')
      pdf.text('Propietario:', col1X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const propietario = support.owner || 'N/A'
      const propietarioLines = pdf.splitTextToSize(propietario, 50)
      pdf.text(propietarioLines[0], col1X + 23, yPosition)
      
      // Zona
      pdf.setFont('helvetica', 'bold')
      pdf.text('Zona:', col2X, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(support.zona || 'N/A', col2X + 12, yPosition)
      
      // Tipo
      pdf.setFont('helvetica', 'bold')
      pdf.text('Tipo:', col3X, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(support.formato || 'N/A', col3X + 10, yPosition)
      
      // Disponibilidad (si ocupado, mostrar fecha)
      if (estado === 'Ocupado' && support.fechaDisponible) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Disponible:', col4X, yPosition)
        pdf.setFont('helvetica', 'normal')
        const fechaDisp = new Date(support.fechaDisponible).toLocaleDateString('es-ES')
        pdf.text(fechaDisp, col4X + 22, yPosition)
      }
      
      yPosition += 8
      
      // Tercera fila
      // Dimensiones
      pdf.setFont('helvetica', 'bold')
      pdf.text('Dimensiones:', col1X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const dimensiones = support.medidas || 'N/A'
      pdf.text(dimensiones, col1X + 26, yPosition)
      
      // Área
      pdf.setFont('helvetica', 'bold')
      pdf.text('Área:', col2X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const area = support.area ? `${support.area} m²` : 'N/A'
      pdf.text(area, col2X + 11, yPosition)
      
      // Tráfico
      pdf.setFont('helvetica', 'bold')
      pdf.text('Tráfico:', col3X, yPosition)
      pdf.setFont('helvetica', 'normal')
      const trafico = support.trafico || 'N/A'
      pdf.text(trafico, col3X + 16, yPosition)
      
      yPosition += 10
      
      // Sección de precios (tabla)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.text('PRECIOS', 15, yPosition)
      
      yPosition += 5
      
      // Tabla de precios
      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)
      
      // Headers
      const tableStartX = 15
      const colWidths = [60, 35, 35, 35, 35, 35]
      let currentX = tableStartX
      
      pdf.setFillColor(240, 240, 240)
      pdf.rect(currentX, yPosition - 3, colWidths.reduce((a, b) => a + b, 0), 6, 'F')
      
      pdf.setFont('helvetica', 'bold')
      pdf.text('Concepto', currentX + 2, yPosition)
      currentX += colWidths[0]
      pdf.text('1 Mes', currentX + 2, yPosition)
      currentX += colWidths[1]
      pdf.text('3 Meses', currentX + 2, yPosition)
      currentX += colWidths[2]
      pdf.text('6 Meses', currentX + 2, yPosition)
      currentX += colWidths[3]
      pdf.text('12 Meses', currentX + 2, yPosition)
      currentX += colWidths[4]
      pdf.text('Impresión', currentX + 2, yPosition)
      
      yPosition += 5
      
      // Fila de alquiler
      currentX = tableStartX
      pdf.setFont('helvetica', 'normal')
      pdf.text('Alquiler Publicidad', currentX + 2, yPosition)
      currentX += colWidths[0]
      pdf.text(support.precio_1_mes ? `Bs. ${support.precio_1_mes.toLocaleString()}` : '-', currentX + 2, yPosition)
      currentX += colWidths[1]
      pdf.text(support.precio_3_meses ? `Bs. ${support.precio_3_meses.toLocaleString()}` : '-', currentX + 2, yPosition)
      currentX += colWidths[2]
      pdf.text(support.precio_6_meses ? `Bs. ${support.precio_6_meses.toLocaleString()}` : '-', currentX + 2, yPosition)
      currentX += colWidths[3]
      pdf.text(support.precio_12_meses ? `Bs. ${support.precio_12_meses.toLocaleString()}` : '-', currentX + 2, yPosition)
      currentX += colWidths[4]
      
      const precioSustrato = support.sustrato_precio_venta || 0
      const areaNum = support.area || 0
      const precioImpresion = precioSustrato * areaNum
      pdf.text(precioImpresion > 0 ? `Bs. ${precioImpresion.toLocaleString()}` : '-', currentX + 2, yPosition)
      
      yPosition += 5
      
      // Línea de sustrato
      if (support.sustrato_nombre) {
        pdf.setFontSize(7)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Sustrato: ${support.sustrato_nombre}`, tableStartX + 2, yPosition)
        yPosition += 3
      }
      
      // Notas (si existen)
      if (support.notas) {
        yPosition += 5
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0, 0, 0)
        pdf.text('Notas:', 15, yPosition)
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        const notasLines = pdf.splitTextToSize(support.notas, 260)
        yPosition += 4
        notasLines.forEach((line: string) => {
          pdf.text(line, 15, yPosition)
          yPosition += 3
        })
      }
      
      // Footer de la página
      const pageHeight = pdf.internal.pageSize.getHeight()
      const footerY = pageHeight - 10
      
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      
      // Contacto del vendedor (solo si hay email)
      if (emailFooter) {
        pdf.text(`Contacto: ${emailFooter}${userNumero ? ' | Tel: ' + userNumero : ''}`, 15, footerY)
      }
      
      // Información de la empresa (derecha)
      pdf.text('contabilidad@publicidadvialimagen.com | NIT: 164692025', 150, footerY)
      
      // Número de página (centro)
      pdf.text(`Página ${index + 1} de ${supports.length}`, pdf.internal.pageSize.getWidth() / 2, footerY, { align: 'center' })
    }
    
    // Retornar el PDF como Buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    console.log('✅ PDF generado exitosamente')
    return pdfBuffer
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    throw error
  }
}
