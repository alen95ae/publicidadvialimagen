export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server"
import { getSoporteById } from "@/lib/supabaseSoportes"
import { getProductoById } from "@/lib/supabaseProductos"
import { rowToSupport, getSustratoDefaultId } from "../../helpers"
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    
    // Obtener el email del parámetro de URL (igual que en cotizaciones)
    const userEmail = url.searchParams.get('email') || undefined
    console.log('📧 Email recibido como parámetro:', userEmail)
    
    if (!ids) {
      return NextResponse.json({ error: "IDs de soportes requeridos" }, { status: 400 })
    }

    const supportIds = ids.split(',')
    console.log('🔍 Exporting PDF for supports:', supportIds)

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
    const pdf = await generatePDF(supports, userEmail)
    
    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="catalogo-soportes-${new Date().toISOString().split('T')[0]}.pdf"`)
    
    return new NextResponse(pdf, { headers })
  } catch (error) {
    console.error("Error generando PDF:", error)
    return NextResponse.json({ error: "Error al generar el catálogo" }, { status: 500 })
  }
}

async function generatePDF(supports: any[], userEmail?: string): Promise<Buffer> {
  try {
    console.log('📄 Generando PDF catálogo con email:', userEmail)
    const currentDate = new Date().toLocaleDateString('es-ES')
    const currentYear = new Date().getFullYear()
    const pdf = new jsPDF('l', 'mm', 'a4') // Cambio a landscape (horizontal)
    
    // Configuración de colores
    const primaryColor: [number, number, number] = [213, 70, 68] // #D54644
    
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

    // Cargar el logo para la marca de agua (una sola vez)
    let logoBase64Watermark: string | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64Watermark = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
    } catch (error) {
      console.log('Error cargando logo para marca de agua:', error)
    }

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
          // Cargar el nuevo logo JPG con proporciones exactas
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
          console.log('Logo JPG cargado exitosamente con proporciones 24x5.5')
          return true
        } catch (error) {
          console.log('Error cargando logo JPG, intentando fallbacks:', error)
          
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
            console.log('Logo PNG fallback cargado exitosamente')
            return true
          } catch (pngError) {
            console.log('Error cargando logo PNG, intentando SVG:', pngError)
            
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
              console.log('Logo SVG cargado exitosamente')
              return true
            } catch (finalError) {
              console.log('Error cargando todos los logos:', finalError)
              return false
            }
          }
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
      
      // Imagen principal del soporte y mapa de ubicación
      if (support.images && support.images.length > 0) {
        try {
          // Imagen principal del soporte (izquierda) - Aumentada de tamaño
          const imageUrl = support.images[0]
          if (imageUrl) {
            // Convertir URL a base64 si es necesario
            let imageBase64 = imageUrl
            let imageFormat = 'JPEG' // Por defecto
            
            if (!imageUrl.startsWith('data:')) {
              // Si es una URL externa, intentar cargarla
              try {
                console.log(`📥 Descargando imagen del soporte: ${imageUrl.substring(0, 100)}...`)
                
                // Asegurar que la URL sea válida
                if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                  throw new Error(`URL inválida: ${imageUrl}`)
                }
                
                // Crear AbortController para timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos
                
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
                
                const contentType = response.headers.get('content-type') || ''
                
                // Detectar formato de imagen
                if (contentType.includes('png') || imageUrl.toLowerCase().includes('.png')) {
                  imageFormat = 'PNG'
                } else if (contentType.includes('jpeg') || contentType.includes('jpg') || imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg')) {
                  imageFormat = 'JPEG'
                } else if (contentType.includes('webp') || imageUrl.toLowerCase().includes('.webp')) {
                  imageFormat = 'WEBP'
                } else {
                  // Intentar detectar por extensión si no hay content-type
                  const urlLower = imageUrl.toLowerCase()
                  if (urlLower.includes('.png')) imageFormat = 'PNG'
                  else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) imageFormat = 'JPEG'
                  else if (urlLower.includes('.webp')) imageFormat = 'WEBP'
                }
                
                const base64 = Buffer.from(imageBuffer).toString('base64')
                imageBase64 = `data:image/${imageFormat.toLowerCase()};base64,${base64}`
                console.log(`✅ Imagen cargada exitosamente (formato: ${imageFormat}, tamaño: ${(imageBuffer.byteLength / 1024).toFixed(2)} KB)`)
              } catch (error) {
                console.error('❌ Error cargando imagen del soporte:', error instanceof Error ? error.message : error)
                console.error('   URL:', imageUrl.substring(0, 150))
                imageBase64 = null
              }
            } else {
              // Si ya es base64, detectar formato del data URI
              if (imageUrl.includes('data:image/png')) {
                imageFormat = 'PNG'
              } else if (imageUrl.includes('data:image/jpeg') || imageUrl.includes('data:image/jpg')) {
                imageFormat = 'JPEG'
              } else if (imageUrl.includes('data:image/webp')) {
                imageFormat = 'WEBP'
              }
            }
            
            if (imageBase64) {
              try {
                // Aumentar tamaño de 120x80 a 130x90, más a la izquierda
                pdf.addImage(imageBase64, imageFormat, 15, yPosition, 130, 90)
                console.log(`✅ Imagen agregada al PDF (formato: ${imageFormat})`)
              } catch (pdfError) {
                console.error('❌ Error agregando imagen al PDF:', pdfError)
              }
            }
          }
        } catch (error) {
          console.error('❌ Error procesando imagen del soporte:', error)
        }
      }
      
      // Mapa de ubicación (derecha) - Usar Google Maps Static API con marcador personalizado
      if (support.latitude && support.longitude) {
        try {
          const lat = support.latitude
          const lng = support.longitude
          const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          
          // Tamaño del mapa en el PDF (en mm, convertido a pixels para la API)
          const mapWidth = 130 // mm
          const mapHeight = 90 // mm
          const mapX = 155  // Más cerca de la imagen principal (15 + 130 + 10 = 155)
          const mapY = yPosition
          
          // Convertir mm a pixels (1mm ≈ 3.7795 pixels a 96 DPI)
          const mapWidthPx = Math.round(mapWidth * 3.7795)
          const mapHeightPx = Math.round(mapHeight * 3.7795)
          
          let mapBase64: string | null = null
          let mapSource: 'osm' | null = null
          
          // Generar mapa con OpenStreetMap - Grid de 3x3 tiles con marcador exacto
          try {
            console.log(`🗺️ Generando mapa OSM para ${lat}, ${lng}`)
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
            
            console.log(`📍 Tile central: ${tileX}, ${tileY}`)
            console.log(`📍 Posición del marcador en el grid: ${pixelX.toFixed(2)}, ${pixelY.toFixed(2)}`)
            
            // Descargar grid de 3x3 tiles y crear composites
            const composites: any[] = []
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx
                const ty = tileY + dy
                const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`
                
                try {
                  const tileResponse = await fetch(tileUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PublicidadVialImagen/1.0)' }
                  })
                  
                  if (tileResponse.ok) {
                    const tileBuffer = Buffer.from(await tileResponse.arrayBuffer())
                    const col = dx + 1 // -1 -> 0, 0 -> 1, 1 -> 2
                    const row = dy + 1
                    
                    composites.push({
                      input: tileBuffer,
                      left: col * tileSize,
                      top: row * tileSize
                    })
                    console.log(`✅ Tile ${tx},${ty} descargado`)
                  } else {
                    console.warn(`⚠️ Tile ${tx},${ty} falló: ${tileResponse.status}`)
                  }
                } catch (err) {
                  console.warn(`⚠️ Error descargando tile ${tx},${ty}:`, err)
                }
                
                // Pequeña pausa para no sobrecargar OSM
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            }
            
            console.log(`📊 Total de tiles descargados: ${composites.length}/9`)
            
            if (composites.length === 0) {
              throw new Error('No se pudo descargar ningún tile')
            }
            
            // Crear canvas base y componer tiles
            const gridSize = 3 * tileSize
            const baseCanvas = sharp({
              create: {
                width: gridSize,
                height: gridSize,
                channels: 4,
                background: { r: 200, g: 200, b: 200, alpha: 1 }
              }
            })
            
            const mapWithTiles = await baseCanvas.composite(composites).png().toBuffer()
            
            // Agregar icono del billboard
            const iconPath = path.join(process.cwd(), 'public', 'icons', 'billboard.svg')
            let finalMapBuffer = mapWithTiles
            
            if (fs.existsSync(iconPath)) {
              const iconSize = 40
              const iconBuffer = await sharp(iconPath)
                .resize(iconSize, iconSize, { fit: 'contain' })
                .png()
                .toBuffer()
              
              finalMapBuffer = await sharp(mapWithTiles)
                .composite([{
                  input: iconBuffer,
                  left: Math.floor(pixelX - iconSize / 2),
                  top: Math.floor(pixelY - iconSize)
                }])
                .png()
                .toBuffer()
              
              console.log(`✅ Icono agregado`)
            }
            
            // Recortar al tamaño deseado (centrado en el marcador)
            const cropLeft = Math.max(0, Math.min(gridSize - mapWidthPx, Math.floor(pixelX - mapWidthPx / 2)))
            const cropTop = Math.max(0, Math.min(gridSize - mapHeightPx, Math.floor(pixelY - mapHeightPx / 2)))
            
            const finalBuffer = await sharp(finalMapBuffer)
              .extract({
                left: cropLeft,
                top: cropTop,
                width: Math.min(mapWidthPx, gridSize - cropLeft),
                height: Math.min(mapHeightPx, gridSize - cropTop)
              })
              .resize(mapWidthPx, mapHeightPx, { fit: 'fill' })
              .png()
              .toBuffer()
            
            mapBase64 = `data:image/png;base64,${finalBuffer.toString('base64')}`
            mapSource = 'osm'
            console.log(`✅ Mapa OSM generado (${(finalBuffer.length / 1024).toFixed(2)} KB)`)
          } catch (osmError) {
            console.error('❌ Error generando mapa OSM:', osmError)
          }
          
          
          // Agregar el mapa al PDF si se generó exitosamente
          if (mapBase64) {
            try {
              pdf.addImage(mapBase64, 'PNG', mapX, mapY, mapWidth, mapHeight)
              
              // Agregar enlace clickeable al mapa para Google Maps
              const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
              pdf.link(mapX, mapY, mapWidth, mapHeight, { url: googleMapsUrl })
              
              // El icono de billboard ya está incluido en el mapa generado con OSM
              // No es necesario agregarlo de nuevo
              if (false) { // Código legacy, ya no se usa
                const iconSize = 12 // Tamaño del icono en mm
                const iconX = mapX + mapWidth/2 - iconSize/2
                const iconY = mapY + mapHeight/2 - iconSize/2
                
                // Dibujar icono de valla publicitaria usando formas geométricas
                const redColor = [220, 38, 38] // #DC2626 (rojo de la marca)
                
                // Guardar estado actual
                pdf.saveGraphicsState()
                
                // Dibujar la valla (rectángulo principal)
                pdf.setFillColor(redColor[0], redColor[1], redColor[2])
                pdf.setDrawColor(255, 255, 255) // Borde blanco
                pdf.setLineWidth(0.5)
                const billboardWidth = iconSize * 0.75
                const billboardHeight = iconSize * 0.5
                const billboardX = iconX + (iconSize - billboardWidth) / 2
                const billboardY = iconY + (iconSize - billboardHeight) / 2 - 2
                
                pdf.roundedRect(billboardX, billboardY, billboardWidth, billboardHeight, 1, 1, 'FD')
                
                // Dibujar el poste de soporte
                const postWidth = iconSize * 0.15
                const postHeight = iconSize * 0.3
                const postX = iconX + (iconSize - postWidth) / 2
                const postY = billboardY + billboardHeight
                
                pdf.roundedRect(postX, postY, postWidth, postHeight, 0.5, 0.5, 'FD')
                
                // Restaurar estado
                pdf.restoreGraphicsState()
              }
              
              // Agregar indicador visual de que es clickeable
              pdf.setTextColor(0, 0, 255) // Azul para indicar enlace
              pdf.setFontSize(6)
              pdf.setFont('helvetica', 'normal')
              pdf.text('Clic para abrir en Google Maps', mapX + mapWidth/2, mapY + mapHeight + 3, { align: 'center' })
              
              console.log('✅ Mapa agregado al PDF exitosamente')
            } catch (pdfError) {
              console.error('❌ Error agregando mapa al PDF:', pdfError)
            }
          } else {
            // Fallback: mostrar coordenadas sin mapa
            console.warn('⚠️ No se pudo generar el mapa, mostrando solo coordenadas')
            pdf.setTextColor(0, 0, 0)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'bold')
            pdf.text('UBICACIÓN', 220, yPosition + 5, { align: 'center' })
            pdf.setFontSize(6)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Lat: ${lat.toFixed(4)}`, 200, yPosition + 15)
            pdf.text(`Lng: ${lng.toFixed(4)}`, 200, yPosition + 20)
          }
          
        } catch (error) {
          console.error('❌ Error generando mapa:', error)
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
      }
      
      yPosition += 100 // Aumentado de 90 a 100 para bajar la línea roja
      
      // Línea separadora
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.line(15, yPosition, 282, yPosition)
      yPosition += 15 // Aumentado de 10 a 15 para más espacio
      
      // Tabla con 4 columnas y 3 filas (más grande)
      const tableX = 15
      const tableWidth = 267 // 297 - 30 (márgenes más pequeños)
      const tableY = yPosition
      const colWidths = [66, 66, 66, 69] // 4 columnas más anchas
      const rowHeight = 16 // Altura de cada fila más grande
      const numRows = 3
      
      // Configurar estilos de tabla
      pdf.setLineWidth(0.2)
      pdf.setDrawColor(180, 180, 180)
      
      // Preparar datos para la tabla (4 columnas x 3 filas)
      const tableData = [
        [
          `Código: ${support.code}`,
          `Tipo de soporte: ${support.type}`,
          `Sustrato de impresión: Lona`,
          `Período de alquiler: Mensual`
        ],
        [
          `Ciudad: ${support.city}`,
          `Medidas: ${support.widthM}m × ${support.heightM}m`,
          `Divisa: Bs`,
          `Costo de Producción: ${(() => {
            // SIEMPRE recalcular área desde ancho × alto (ignorar valor guardado)
            const areaCalculada = (support.widthM || 0) * (support.heightM || 0)
            const areaFinal = areaCalculada > 0 ? areaCalculada : (support.areaM2 || 0)
            if (support.sustrato_precio_venta && areaFinal > 0) {
              return (support.sustrato_precio_venta * areaFinal).toLocaleString('es-ES', { maximumFractionDigits: 2 })
            }
            return 'N/A'
          })()} Bs`
        ],
        [
          `Zona: ${support.zona || 'N/A'}`,
          `Iluminación: ${support.lighting || 'No'}`,
          `Impactos diarios: ${support.impactosDiarios?.toLocaleString() || 'N/A'}`,
          `Costo de alquiler: ${support.priceMonth?.toLocaleString() || 'N/A'} Bs`
        ]
      ]
      
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
          
          // Texto (más grande)
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(11) // Aumentado de 9 a 11
          pdf.setFont('helvetica', 'normal')
          
          // Ajustar texto si es muy largo
          const text = tableData[row][col]
          const maxWidth = colWidths[col] - 4
          const textLines = pdf.splitTextToSize(text, maxWidth)
          const textY = cellY + (rowHeight / 2) + 3 // Ajustado para centrar mejor
          
          pdf.text(textLines, cellX + 3, textY)
          
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
          const createdDate = new Date(support.createdTime).toLocaleDateString('es-ES')
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
      
      // Agregar marca de agua diagonal con el logo ANTES del footer (por encima de todo)
      if (logoBase64Watermark) {
        // Guardar el estado actual
        pdf.saveGraphicsState()
        
        // Establecer opacidad al 25% (más transparente)
        pdf.setGState(new pdf.GState({ opacity: 0.25 }))
        
        // Calcular dimensiones para la marca de agua
        const pageHeight = 210 // A4 landscape alto
        const aspectRatio = 24 / 5.5
        
        // Hacer el logo MUCHO más grande (aproximadamente 260mm de ancho)
        const watermarkWidth = 260
        const watermarkHeight = watermarkWidth / aspectRatio
        
        // Centrar exactamente en la diagonal (esquina inferior izquierda a superior derecha)
        // El centro de la página es el punto medio de la diagonal
        const centerX = pageWidth / 2 + 30  // Más a la derecha (148.5 + 30 = 178.5mm)
        const centerY = pageHeight / 2 // 105mm - centro exacto de la diagonal
        
        // Calcular el ángulo exacto de la diagonal de la página
        // Para ir de esquina inferior izquierda (0, 210) a superior derecha (297, 0)
        const angle = Math.atan(pageHeight / pageWidth) * (180 / Math.PI) // ≈ 35.32 grados
        
        // Marca de agua (posicionada más abajo y ajustada)
        const centerY2 = centerY + 50 // 50mm más abajo (un poco más arriba que antes)
        pdf.addImage(
          logoBase64Watermark, 
          'JPEG', 
          centerX - watermarkWidth / 2, 
          centerY2 - watermarkHeight / 2, 
          watermarkWidth, 
          watermarkHeight,
          undefined,
          'NONE',
          angle // Ángulo de rotación diagonal
        )
        
        // Restaurar el estado gráfico
        pdf.restoreGraphicsState()
      }
      
      // Fondo rojo del footer
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, pageWidth, 12, 'F')
      
      // Texto en blanco
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      
      // Distribuir el footer con separadores (igual que en cotización)
      // Izquierda: © 2025 Publicidad Vial Imagen
      pdf.text(`© ${currentYear} Publicidad Vial Imagen`, 5, footerY + 7)
      
      // Separador 1 (entre izquierda y centro)
      pdf.text('|', 75, footerY + 7)
      
      // Centro (centrado en la página): publicidadvialimagen.com
      pdf.text('publicidadvialimagen.com', pageWidth / 2, footerY + 7, { align: 'center' })
      
      // Separador 2 (entre centro y derecha)
      pdf.text('|', 220, footerY + 7)
      
      // Derecha (antes de la paginación): email (si existe)
      if (userEmail && userEmail.trim() !== '') {
        pdf.text(userEmail, 225, footerY + 7)
      }
      
      // Separador 3 (entre email y paginación) - solo si hay email
      if (userEmail && userEmail.trim() !== '') {
        pdf.text('|', 270, footerY + 7)
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
