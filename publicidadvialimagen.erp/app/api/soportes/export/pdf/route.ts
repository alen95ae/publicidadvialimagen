export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server"
import { getSoporteById } from "@/lib/supabaseSoportes"
import { formatDateBolivia, todayBolivia } from "@/lib/utils"
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
 * Función para cargar una imagen desde URL (sin compresión)
 */
async function loadImage(imageUrl: string): Promise<{ base64: string | null; format: string }> {
  if (!imageUrl) {
    return { base64: null, format: 'JPEG' }
  }

  // Si ya es base64, retornarla sin comprimir
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
      const imgCanvas = createCanvas(img.width, img.height)
      const imgCtx = imgCanvas.getContext('2d')
      imgCtx.drawImage(img, 0, 0)
      
      // Verificar si PNG tiene transparencia real (canal alfa usado)
      let hasAlpha = false
      if (isPNG) {
        const imageData = imgCtx.getImageData(0, 0, img.width, img.height)
        const data = imageData.data
        // Verificar si algún pixel tiene alpha < 255
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            hasAlpha = true
            break
          }
        }
      }
      
      // Estrategia de compresión conservadora
      if (isPNG && !hasAlpha) {
        // PNG sin transparencia → JPEG progresivo 89%
        const compressedBuffer = imgCanvas.toBuffer('image/jpeg', { 
          quality: 0.89, 
          progressive: true,
          chromaSubsampling: false 
        })
        return {
          base64: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
          format: 'JPEG'
        }
      } else if (format === 'JPEG' || isWEBP) {
        // JPEG/WEBP → recomprimir a JPEG progresivo 89%
        const compressedBuffer = imgCanvas.toBuffer('image/jpeg', { 
          quality: 0.89, 
          progressive: true,
          chromaSubsampling: false 
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
    console.error('❌ Error cargando imagen del soporte:', error instanceof Error ? error.message : error)
    console.error('   URL:', imageUrl.substring(0, 150))
    return { base64: null, format: 'JPEG' }
  }
}

/**
 * Función para generar mapa OSM respetando políticas de rate limiting
 * Concurrencia limitada a 2 requests simultáneas + delays entre tiles
 */
async function generateOSMMap(lat: number, lng: number, mapWidthPx: number, mapHeightPx: number): Promise<string | null> {
  try {
    const zoom = 17
    const tileSize = 256

    // Calcular el tile central
    const n = Math.pow(2, zoom)
    const centerX = (lng + 180) / 360 * n
    const centerY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n

    const tileX = Math.floor(centerX)
    const tileY = Math.floor(centerY)

    // Calcular la posición del marcador dentro del grid completo (3x3 tiles)
    const pixelX = (centerX - tileX) * tileSize + tileSize
    const pixelY = (centerY - tileY) * tileSize + tileSize

    // Construir lista de tiles a descargar
    const tilesToDownload: Array<{ tx: number; ty: number; col: number; row: number }> = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        tilesToDownload.push({
          tx: tileX + dx,
          ty: tileY + dy,
          col: dx + 1,
          row: dy + 1
        })
      }
    }

    // Pool de concurrencia: máximo 2 requests simultáneas
    const MAX_CONCURRENT = 2
    const DELAY_BETWEEN_TILES = 120 // ms
    const composites: Array<{ input: Buffer; left: number; top: number }> = []

    for (let i = 0; i < tilesToDownload.length; i += MAX_CONCURRENT) {
      const batch = tilesToDownload.slice(i, i + MAX_CONCURRENT)
      
      const batchPromises = batch.map(async ({ tx, ty, col, row }) => {
        const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
          
          const tileResponse = await fetch(tileUrl, {
            headers: {
              'User-Agent': 'PublicidadVialImagen/1.0 (+https://publicidadvialimagen.com; contacto@publicidadvialimagen.com)',
              'Accept': 'image/png,image/*',
              'Referer': 'https://publicidadvialimagen.com'
            },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (tileResponse.ok) {
            const tileBuffer = Buffer.from(await tileResponse.arrayBuffer())
            return {
              input: tileBuffer,
              left: col * tileSize,
              top: row * tileSize
            }
          } else {
            console.error(`Tile ${tx},${ty} falló: HTTP ${tileResponse.status} - ${tileUrl}`)
            return null
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          console.error(`Tile ${tx},${ty} error: ${errorMsg} - ${tileUrl}`)
          return null
        }
      })
      
      // Esperar el batch actual
      const batchResults = await Promise.all(batchPromises)
      
      // Agregar tiles exitosos
      batchResults.forEach(result => {
        if (result !== null) {
          composites.push(result)
        }
      })
      
      // Delay entre batches (excepto después del último)
      if (i + MAX_CONCURRENT < tilesToDownload.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TILES))
      }
    }

    // Continuar si tenemos AL MENOS 1 tile (no exigir todos)
    if (composites.length === 0) {
      throw new Error('No se pudo descargar ningún tile de OSM')
    }

    // Componer grid 3x3 (768x768px) sin sharp usando Canvas API
    const gridSize = 3 * tileSize // 768px
    
    try {
      // Intentar usar Canvas API si está disponible (import dinámico)
      const canvasModule = await import('canvas')
      const { createCanvas, loadImage } = canvasModule
      const canvas = createCanvas(gridSize, gridSize)
      const ctx = canvas.getContext('2d')
      
      // Fondo gris para tiles faltantes
      ctx.fillStyle = '#c8c8c8'
      ctx.fillRect(0, 0, gridSize, gridSize)
      
      // Componer todos los tiles en sus posiciones exactas
      for (const composite of composites) {
        const img = await loadImage(composite.input)
        ctx.drawImage(img, composite.left, composite.top)
      }
      
      // Recortar centrado en el marcador (exactamente como antes)
      const cropLeft = Math.max(0, Math.min(gridSize - mapWidthPx, Math.floor(pixelX - mapWidthPx / 2)))
      const cropTop = Math.max(0, Math.min(gridSize - mapHeightPx, Math.floor(pixelY - mapHeightPx / 2)))
      
      // Agregar icono del billboard en la posición exacta (pixelX, pixelY)
      // Tamaño: 20mm en el PDF final
      // Cálculo: El mapa recortado (mapWidthPx) se redimensiona a 130mm en el PDF
      // Escala: mapWidthPx píxeles = 130mm → 1mm = mapWidthPx/130 píxeles
      // Para 20mm: iconSizePx = 20 * (mapWidthPx / 130)
      try {
        const iconPath = path.join(process.cwd(), 'public', 'billboard.png')
        if (fs.existsSync(iconPath)) {
          const iconImg = await loadImage(iconPath)
          const iconSizeMm = 20 // 20mm en el PDF final
          const iconSizePx = Math.round(iconSizeMm * mapWidthPx / 130)
          
          // Desplazamiento: 10mm hacia abajo en el PDF final
          // Convertir 10mm a píxeles del canvas: 10mm * (mapHeightPx / 90mm)
          const offsetDownMm = 10
          const offsetDownPx = Math.round(offsetDownMm * mapHeightPx / 90)
          
          // Posición exacta: pixelX es el centro horizontal, pixelY es la base vertical
          // El icono se centra en pixelX y se coloca con su base en pixelY + offsetDownPx
          ctx.drawImage(iconImg, pixelX - iconSizePx / 2, pixelY - iconSizePx + offsetDownPx, iconSizePx, iconSizePx)
        }
      } catch (iconError) {
        // Si falla el icono, continuar sin él
        console.error('Error agregando icono en composición:', iconError)
      }
      
      // Crear canvas recortado y redimensionado
      const croppedCanvas = createCanvas(mapWidthPx, mapHeightPx)
      const croppedCtx = croppedCanvas.getContext('2d')
      croppedCtx.drawImage(
        canvas,
        cropLeft, cropTop, mapWidthPx, mapHeightPx,
        0, 0, mapWidthPx, mapHeightPx
      )
      
      // Optimización de peso: JPEG progresivo 91% sin cambiar lógica de generación
      const finalMapBuffer = croppedCanvas.toBuffer('image/jpeg', { 
        quality: 0.91, 
        progressive: true,
        chromaSubsampling: false // Mantener calidad de color
      })
      return `data:image/jpeg;base64,${finalMapBuffer.toString('base64')}`
    } catch (canvasError) {
      // Fallback: si Canvas no está disponible, retornar tile central
      console.error('Canvas no disponible, usando tile central:', canvasError)
      const centralTile = composites.find(c => c.left === tileSize && c.top === tileSize) || composites[0]
      return `data:image/png;base64,${centralTile.input.toString('base64')}`
    }
  } catch (error) {
    console.error('❌ Error generando mapa OSM:', error)
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
  precios = false,
}: {
  disponibilidad?: string; // "disponibles" | "ocupados"
  ciudad?: string;
  soporte?: string;
  precios?: boolean;
}): string {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, "0")}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}-${hoy.getFullYear()}`;
  const sufijo = precios ? ` - precios - ${fecha}.pdf` : ` - ${fecha}.pdf`;

  // Opción 4: Un solo soporte seleccionado
  if (soporte) {
    return `${soporte}${sufijo}`;
  }

  // Opción 1: disponibilidad + ciudad
  if (disponibilidad && ciudad) {
    const dispUpper =
      disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
    return `${dispUpper} - ${ciudad}${sufijo}`;
  }

  // Opción 2: solo disponibilidad
  if (disponibilidad) {
    const dispUpper =
      disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
    return `${dispUpper}${sufijo}`;
  }

  // Opción 3: solo ciudad
  if (ciudad) {
    return `${ciudad}${sufijo}`;
  }

  // Opción 5: nada seleccionado
  return `Catalogo Vallas Publicitarias${sufijo}`;
}

/**
 * Construye el título que se muestra dentro del PDF (misma lógica que el nombre de archivo, sin extensión ni fecha)
 */
function buildPDFCatalogTitle({
  disponibilidad,
  ciudad,
  soporte,
}: {
  disponibilidad?: string;
  ciudad?: string;
  soporte?: string;
}): string {
  if (soporte) return soporte;
  if (disponibilidad && ciudad) {
    const disp = disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
    return `${disp} - ${ciudad}`;
  }
  if (disponibilidad) return disponibilidad === "disponibles" ? "Disponibles" : "Ocupados";
  if (ciudad) return ciudad;
  return "Catálogo de vallas publicitarias";
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

    const variant = url.searchParams.get('variant') || undefined
    const include3Meses = (() => { const p = url.searchParams.get('include3Meses'); return p === null ? true : p === 'true' })()
    const include6Meses = (() => { const p = url.searchParams.get('include6Meses'); return p === null ? true : p === 'true' })()
    const include12Meses = (() => { const p = url.searchParams.get('include12Meses'); return p === null ? true : p === 'true' })()
    const catalogTitleLabel = buildPDFCatalogTitle({
      disponibilidad,
      ciudad,
      soporte: soporteTitulo,
    })
    const pdf = await generatePDF(supports, userEmail, userNumero, variant === 'precios' ? 'precios' : undefined, catalogTitleLabel, { include3Meses, include6Meses, include12Meses })
    
    // Construir nombre del archivo dinámico (precios = palabra "precios" antes de la fecha)
    let fileName = buildPDFFileName({
      disponibilidad,
      ciudad,
      soporte: soporteTitulo,
      precios: variant === 'precios',
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

async function generatePDF(supports: any[], userEmail?: string, userNumero?: string, variant?: 'precios', catalogTitleLabel?: string, preciosInclude?: { include3Meses: boolean; include6Meses: boolean; include12Meses: boolean }): Promise<Buffer> {
  try {
    const emailFooter = obtenerEmailFooter(userEmail)
    console.log('📄 Generando PDF catálogo con email:', emailFooter, 'y número:', userNumero)
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

    // Cargar el logo para la marca de agua y header (una sola vez) - comprimido
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

    // Pre-procesar todas las imágenes y mapas en paralelo ANTES del loop (optimización)
    console.log('🔄 Pre-procesando imágenes y mapas en paralelo...')
    const mapWidth = 130 // mm
    const mapHeight = 90 // mm
    const mapWidthPx = Math.round(mapWidth * 3.7795)
    const mapHeightPx = Math.round(mapHeight * 3.7795)

    const preprocessPromises = supports.map(async (support, index) => {
      const processed: { image: { base64: string | null; format: string } | null; map: string | null } = {
        image: null,
        map: null
      }

      // Pre-cargar imagen en paralelo
      if (support.images && support.images.length > 0) {
        processed.image = await loadImage(support.images[0])
      }

      // Pre-generar mapa en paralelo
      if (support.latitude && support.longitude) {
        processed.map = await generateOSMMap(support.latitude, support.longitude, mapWidthPx, mapHeightPx)
      }

      return processed
    })

    const preprocessedData = await Promise.all(preprocessPromises)
    console.log('✅ Pre-procesamiento completado')

    // Agregar cada soporte (una página por soporte)
    for (let index = 0; index < supports.length; index++) {
      const support = supports[index]
      // Nueva página para cada soporte (excepto el primero)
      if (index > 0) {
        pdf.addPage()
      }
      
      yPosition = 10
      
      // Logo de la empresa (esquina superior derecha) - Con proporciones exactas 24x5.5
      const addLogo = () => {
        try {
          // Usar el logo comprimido que ya se cargó antes del loop
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
          
          // Fallback: intentar cargar sin comprimir (solo si no se cargó antes)
          const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
          const logoBuffer = fs.readFileSync(logoPath)
          const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
          
          // Proporciones exactas 24x5.5 (aspectRatio = 24/5.5 ≈ 4.36) - Tamaño reducido a la mitad
          const aspectRatio = 24 / 5.5
          const maxHeight = 7.5 // Altura reducida a la mitad (15/2)
          const calculatedWidth = maxHeight * aspectRatio
          const logoWidth = Math.min(calculatedWidth, 35) // Ancho reducido a la mitad (70/2)
          const logoHeight = logoWidth / aspectRatio // Altura calculada para mantener proporción exacta
          
          const logoX = 20 // Posición a la izquierda del título
          const logoY = yPosition - 1
          
          pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, logoHeight)
          return true
        } catch (error) {
          try {
            // Fallback 1: Captura de pantalla
            const logoPath = path.join(process.cwd(), 'public', 'Captura de pantalla 2025-10-27 a la(s) 7.12.41 p.m..png')
            const logoBuffer = fs.readFileSync(logoPath)
            const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
            
            const logoWidth = 30 // Reducido a la mitad
            const logoHeight = 7.5 // Reducido a la mitad
            const logoX = 20 // Posición a la izquierda del título
            const logoY = yPosition - 1
            
            pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight)
            return true
          } catch (pngError) {
            try {
              // Fallback 2: Logo SVG del ERP
              const logoPath = path.join(process.cwd(), 'public', 'logo-publicidad-vial-imagen.svg')
              const logoBuffer = fs.readFileSync(logoPath)
              const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`
              
              const logoWidth = 30 // Reducido a la mitad
              const logoHeight = 7.5 // Reducido a la mitad
              const logoX = 20 // Posición a la izquierda del título
              const logoY = yPosition - 1
              
              pdf.addImage(logoBase64, 'SVG', logoX, logoY, logoWidth, logoHeight)
              return true
            } catch (finalError) {
              return false
            }
          }
        }
      }
      
      // Ejecutar la función del logo
      addLogo()
      
      // Título: en todas las páginas (incluida la primera) el nombre del soporte; el título del archivo solo va en el nombre del PDF
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      const titleLength = support.title.length
      const titleFontSize = titleLength <= 60 ? 18
        : titleLength <= 70 ? 16
        : titleLength <= 80 ? 14
        : 12
      pdf.setFontSize(titleFontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.text(support.title, 70, yPosition + 5)
      
      yPosition += 20
      
      // Imagen principal del soporte (usar datos pre-procesados)
      const preprocessedImage = preprocessedData[index]?.image
      if (preprocessedImage && preprocessedImage.base64) {
        try {
          const imageX = 15
          const imageY = yPosition
          const imageWidth = 130
          const imageHeight = 90
          
          pdf.addImage(preprocessedImage.base64, preprocessedImage.format, imageX, imageY, imageWidth, imageHeight)
          
          // Agregar enlace clickeable a la imagen para abrir en página web
          const webUrl = getSoporteWebUrl(support.title, support.id, support.code)
          pdf.link(imageX, imageY, imageWidth, imageHeight, { url: webUrl })
          
          // Agregar marca de agua sobre la imagen (más grande y que salga de la imagen)
          if (logoBase64Watermark) {
            pdf.saveGraphicsState()
            pdf.setGState(new pdf.GState({ opacity: 0.08 })) // Más apagada
            
            const aspectRatio = 24 / 5.5
            const watermarkWidth = 120 // El triple de grande (40 * 3)
            const watermarkHeight = watermarkWidth / aspectRatio
            
            // Centrar sobre la imagen pero que salga un poco
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
          
          // Agregar indicador visual de que es clickeable (debajo de la imagen)
          pdf.setTextColor(0, 0, 255) // Azul para indicar enlace
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.text('Clic para abrir en página web', imageX + imageWidth/2, imageY + imageHeight + 3, { align: 'center' })
        } catch (pdfError) {
          console.error('❌ Error agregando imagen al PDF:', pdfError)
        }
      }
      
      // Mapa de ubicación (derecha) - Usar datos pre-procesados
      const preprocessedMap = preprocessedData[index]?.map
      if (preprocessedMap) {
        try {
          const mapWidth = 130 // mm
          const mapHeight = 90 // mm
          const mapX = 155  // Más cerca de la imagen principal (15 + 130 + 10 = 155)
          const mapY = yPosition
          
          pdf.addImage(preprocessedMap, 'PNG', mapX, mapY, mapWidth, mapHeight)
          
          // Agregar marca de agua sobre el mapa (más grande y que salga del mapa)
          if (logoBase64Watermark) {
            pdf.saveGraphicsState()
            pdf.setGState(new pdf.GState({ opacity: 0.08 })) // Más apagada
            
            const aspectRatio = 24 / 5.5
            const watermarkWidth = 120 // El triple de grande (40 * 3)
            const watermarkHeight = watermarkWidth / aspectRatio
            
            // Centrar sobre el mapa pero que salga un poco
            const mapCenterX = mapX + mapWidth / 2
            const mapCenterY = mapY + mapHeight / 2
            
            // Rotar 45 grados
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
          
          // Agregar enlace clickeable al mapa para Google Maps
          if (support.latitude && support.longitude) {
            const googleMapsUrl = `https://www.google.com/maps?q=${support.latitude},${support.longitude}`
            pdf.link(mapX, mapY, mapWidth, mapHeight, { url: googleMapsUrl })
          }
          
          // Agregar indicador visual de que es clickeable
          pdf.setTextColor(0, 0, 255) // Azul para indicar enlace
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.text('Clic para abrir en Google Maps', mapX + mapWidth/2, mapY + mapHeight + 3, { align: 'center' })
        } catch (pdfError) {
          console.error('❌ Error agregando mapa al PDF:', pdfError)
        }
      } else if (support.latitude && support.longitude) {
        // Fallback: mostrar coordenadas sin mapa
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('UBICACIÓN', 220, yPosition + 5, { align: 'center' })
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Lat: ${support.latitude.toFixed(4)}`, 200, yPosition + 15)
        pdf.text(`Lng: ${support.longitude.toFixed(4)}`, 200, yPosition + 20)
      }
      
      yPosition += 100 // Aumentado de 90 a 100 para bajar la línea roja
      
      // Línea separadora
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.line(15, yPosition, 282, yPosition)
      yPosition += 15 // Aumentado de 10 a 15 para más espacio
      
      // Tabla: 4 columnas x 3 filas (igual en gestión y precios; en precios la columna derecha = Precio 3/6/12 meses)
      const tableX = 15
      const tableWidth = 267
      const tableY = yPosition
      const colWidths = [66, 66, 66, 69]
      const rowHeight = 16
      const isPreciosVariant = variant === 'precios'
      const numRows = 3
      
      const lonaValue = (() => {
        const areaCalculada = (support.widthM || 0) * (support.heightM || 0)
        const areaFinal = areaCalculada > 0 ? areaCalculada : (support.areaM2 || 0)
        if (support.sustrato_precio_venta && areaFinal > 0) {
          return (support.sustrato_precio_venta * areaFinal).toLocaleString('es-ES', { maximumFractionDigits: 2 })
        }
        return 'N/A'
      })()
      
      // Variante precios: 3 filas, columna derecha = Precio 3 meses, Precio 6 meses, Precio 12 meses
      const inc = preciosInclude ?? { include3Meses: true, include6Meses: true, include12Meses: true }
      const val3 = inc.include3Meses ? (support.price3Months?.toLocaleString() ?? 'N/A') : 'N/A'
      const val6 = inc.include6Meses ? (support.price6Months?.toLocaleString() ?? 'N/A') : 'N/A'
      const val12 = inc.include12Meses ? (support.price12Months?.toLocaleString() ?? 'N/A') : 'N/A'
      const tableData = isPreciosVariant ? [
        [
          { label: 'Código:', value: support.code || 'N/A' },
          { label: 'Tipo de soporte:', value: support.type || 'N/A' },
          { label: 'Período de alquiler:', value: 'Mensual' },
          { label: 'Precio 3 meses:', value: `${val3} Bs` }
        ],
        [
          { label: 'Ciudad:', value: support.city || 'N/A' },
          { label: 'Medidas:', value: `${support.widthM || 'N/A'}m × ${support.heightM || 'N/A'}m` },
          { label: 'Precio de Lona:', value: `${lonaValue} Bs` },
          { label: 'Precio 6 meses:', value: `${val6} Bs` }
        ],
        [
          { label: 'Zona:', value: support.zona || 'N/A' },
          { label: 'Iluminación:', value: support.lighting || 'No' },
          { label: 'Precio 1 Mes:', value: `${support.priceMonth?.toLocaleString() || 'N/A'} Bs` },
          { label: 'Precio 12 meses:', value: `${val12} Bs` }
        ]
      ] : [
        [
          { label: 'Código:', value: support.code || 'N/A' },
          { label: 'Tipo de soporte:', value: support.type || 'N/A' },
          { label: 'Sustrato de impresión:', value: 'Lona' },
          { label: 'Período de alquiler:', value: 'Mensual' }
        ],
        [
          { label: 'Ciudad:', value: support.city || 'N/A' },
          { label: 'Medidas:', value: `${support.widthM || 'N/A'}m × ${support.heightM || 'N/A'}m` },
          { label: 'Divisa:', value: 'Bs' },
          { label: 'Precio de Lona:', value: `${lonaValue} Bs` }
        ],
        [
          { label: 'Zona:', value: support.zona || 'N/A' },
          { label: 'Iluminación:', value: support.lighting || 'No' },
          { label: 'Impactos diarios:', value: support.impactosDiarios?.toLocaleString() || 'N/A' },
          { label: 'Precio de alquiler:', value: `${support.priceMonth?.toLocaleString() || 'N/A'} Bs` }
        ]
      ]
      
      // Configurar estilos de tabla
      pdf.setLineWidth(0.2)
      pdf.setDrawColor(180, 180, 180)
      
      // Dibujar tabla con bordes
      for (let row = 0; row < numRows; row++) {
        let currentX = tableX
        
        for (let col = 0; col < 4; col++) {
          const cellX = currentX
          const cellY = tableY + row * rowHeight
          
          // Fondo blanco y borde en una sola operación
          pdf.setFillColor(255, 255, 255)
          pdf.setDrawColor(180, 180, 180)
          pdf.setLineWidth(0.2)
          pdf.rect(cellX, cellY, colWidths[col], rowHeight, 'FD') // FD = Fill and Draw
          
          // Texto con label en negrita y value en normal
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(11) // Aumentado de 9 a 11
          
          const cellData = tableData[row][col]
          const label = cellData.label
          const value = cellData.value
          
          // Ajustar texto si es muy largo
          const maxWidth = colWidths[col] - 4
          const textY = cellY + (rowHeight / 2) + 3 // Ajustado para centrar mejor
          const startX = cellX + 3
          
          // Escribir label en negrita
          pdf.setFont('helvetica', 'bold')
          const labelWidth = pdf.getTextWidth(label)
          pdf.text(label, startX, textY)
          
          // Escribir value en normal (con ajuste de texto si es necesario)
          pdf.setFont('helvetica', 'normal')
          const valueMaxWidth = maxWidth - labelWidth - 1 // Espacio disponible para el valor
          const valueLines = pdf.splitTextToSize(value, valueMaxWidth)
          
          // Si el valor cabe en una línea, escribirlo en la misma línea
          if (valueLines.length === 1) {
            pdf.text(value, startX + labelWidth + 1, textY)
          } else {
            // Si necesita múltiples líneas, escribir la primera línea
            pdf.text(valueLines[0], startX + labelWidth + 1, textY)
            // Las líneas adicionales se escribirían debajo, pero por simplicidad solo mostramos la primera
          }
          
          currentX += colWidths[col]
        }
      }
      
      yPosition += numRows * rowHeight + 15
      
      // Información adicional si hay espacio
      if (yPosition < 150) {
        // Coordenadas si están disponibles
        if (support.latitude && support.longitude) {
          pdf.setFontSize(10)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`Coordenadas: ${support.latitude.toFixed(6)}, ${support.longitude.toFixed(6)}`, 20, yPosition)
          yPosition += 10
        }
        
        // Fecha de creación si está disponible
        if (support.createdTime) {
          const createdDate = formatDateBolivia(support.createdTime)
          pdf.text(`Creado: ${createdDate}`, 20, yPosition)
        }
      }
    }
    
    // Agregar footers con paginación y marca de agua a todas las páginas
    const totalPages = pdf.getNumberOfPages()
    const footerY = 200 // Para formato landscape (210mm - 10mm)
    const pageWidth = 297 // Ancho de página landscape
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      
      // Fondo rojo del footer
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, pageWidth, 12, 'F')
      
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
      pdf.text(`${i}/${totalPages}`, pageWidth - 5, footerY + 7, { align: 'right' })
    }
    
    // Post-proceso del PDF (limitaciones de jsPDF)
    // NOTA: jsPDF no soporta nativamente:
    // - Deduplicación de imágenes idénticas
    // - Optimización de estructura (streams, object streams, linearización)
    // - Subsetting y deduplicación de fuentes
    // - Eliminación de metadatos y thumbnails
    // Estas optimizaciones requerirían pdf-lib u otra librería de post-procesamiento,
    // lo cual añadiría complejidad y dependencias. La reducción de peso ya se logra
    // mediante la compresión controlada de imágenes y mapas (JPEG progresivo 89-91%).
    
    return Buffer.from(pdf.output('arraybuffer'))
  } catch (error) {
    console.error('Error en generatePDF:', error)
    throw error
  }
}
