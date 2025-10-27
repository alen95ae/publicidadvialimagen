export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"
import { rowToSupport } from "../../helpers"
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    
    if (!ids) {
      return NextResponse.json({ error: "IDs de soportes requeridos" }, { status: 400 })
    }

    const supportIds = ids.split(',')
    console.log('🔍 Exporting PDF for supports:', supportIds)

    // Obtener los soportes específicos
    const supports = []
    for (const id of supportIds) {
      try {
        const record = await airtable("Soportes").find(id)
        if (record) {
          const support = rowToSupport({
            id: record.id,
            ...record.fields
          })
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
    const pdf = await generatePDF(supports)
    
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

async function generatePDF(supports: any[]): Promise<Buffer> {
  try {
    const currentDate = new Date().toLocaleDateString('es-ES')
    const pdf = new jsPDF('l', 'mm', 'a4') // Cambio a landscape (horizontal)
    
    // Configuración de colores
    const primaryColor = [213, 70, 68] // #D54644
    
    let yPosition = 20
    
    // Función para agregar pie de página
    const addFooter = (pdf: jsPDF) => {
      const footerY = 190 // Ajustado para landscape
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, 297, 20, 'F') // 297mm es el ancho en landscape
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.text(`© ${new Date().getFullYear()} Publicidad Vial Imagen`, 148.5, footerY + 8, { align: 'center' })
      pdf.text(`Generado el ${currentDate}`, 148.5, footerY + 14, { align: 'center' })
    }

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
        default:
          return { bg: [243, 244, 246], text: [55, 65, 81] } // gray-100, gray-800
      }
    }

    // Agregar cada soporte (una página por soporte)
    for (let index = 0; index < supports.length; index++) {
      const support = supports[index]
      // Nueva página para cada soporte (excepto el primero)
      if (index > 0) {
        addFooter(pdf) // Agregar pie de página antes de nueva página
        pdf.addPage()
      }
      
      yPosition = 10
      
      // Logo de la empresa (izquierda) - Usando base64 con proporciones originales
      try {
        // Leer el archivo del logo y convertirlo a base64
        const logoPath = path.join(process.cwd(), 'public', 'Mesa de trabajo 1-8.png')
        const logoBuffer = fs.readFileSync(logoPath)
        const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
        
        // Calcular dimensiones manteniendo proporciones originales
        // Asumiendo que el logo tiene una proporción típica de 3:1 (ancho:alto)
        const aspectRatio = 3 // Proporción típica para logos horizontales
        const maxHeight = 20 // Altura máxima deseada
        const calculatedWidth = maxHeight * aspectRatio
        const logoWidth = Math.min(calculatedWidth, 50) // Máximo 50mm de ancho
        const logoHeight = logoWidth / aspectRatio // Altura calculada para mantener proporción
        
        pdf.addImage(logoBase64, 'PNG', 20, yPosition - 2, logoWidth, logoHeight)
      } catch (error) {
        console.log('Error cargando logo desde archivo:', error)
        // Fallback: Logo con texto
        pdf.setFillColor(190, 8, 17) // Color rojo corporativo
        pdf.roundedRect(20, yPosition - 5, 80, 20, 3, 3, 'F')
        
        // Texto del logo como fallback
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PUBLICIDAD', 60, yPosition + 2, { align: 'center' })
        pdf.text('VIAL IMAGEN', 60, yPosition + 8, { align: 'center' })
        
        // Línea decorativa
        pdf.setDrawColor(255, 255, 255)
        pdf.setLineWidth(0.5)
        pdf.line(25, yPosition + 5, 95, yPosition + 5)
      }
      
      // Título del soporte (derecha del logo, en rojo y negrita)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(support.title, 80, yPosition + 5)
      
      yPosition += 35
      
      // Imagen principal del soporte y mapa de ubicación
      if (support.images && support.images.length > 0) {
        try {
          // Imagen principal del soporte (izquierda)
          const imageUrl = support.images[0]
          if (imageUrl) {
            // Convertir URL a base64 si es necesario
            let imageBase64 = imageUrl
            if (!imageUrl.startsWith('data:')) {
              // Si es una URL externa, intentar cargarla
              try {
                const response = await fetch(imageUrl)
                const imageBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(imageBuffer).toString('base64')
                imageBase64 = `data:image/jpeg;base64,${base64}`
              } catch (error) {
                console.log('Error cargando imagen del soporte:', error)
                imageBase64 = null
              }
            }
            
            if (imageBase64) {
              pdf.addImage(imageBase64, 'JPEG', 20, yPosition, 120, 80)
            }
          }
        } catch (error) {
          console.log('Error procesando imagen del soporte:', error)
        }
      }
      
      // Mapa de ubicación (derecha) - OpenStreetMap como en editar soporte
      if (support.latitude && support.longitude) {
        try {
          // Usar OpenStreetMap con zoom 16 (igual que en EditableLeafletMap)
          const zoom = 16
          const size = 300 // Tamaño de la imagen
          
          // Calcular tile coordinates
          const lat = support.latitude
          const lng = support.longitude
          const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
          const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
          
          // URL del tile de OpenStreetMap
          const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
          
          // Descargar la imagen del tile
          const mapResponse = await fetch(tileUrl)
          if (mapResponse.ok) {
            const mapBuffer = await mapResponse.arrayBuffer()
            const mapBase64 = `data:image/png;base64,${Buffer.from(mapBuffer).toString('base64')}`
            
            // Agregar la imagen del mapa al PDF
            const mapWidth = 120
            const mapHeight = 80
            const mapX = 150
            const mapY = yPosition
            
            pdf.addImage(mapBase64, 'PNG', mapX, mapY, mapWidth, mapHeight)
            
            // Agregar chincheta roja en el centro (simulando el icono de valla)
            pdf.setFillColor(255, 0, 0)
            pdf.circle(mapX + mapWidth/2, mapY + mapHeight/2, 3, 'F')
            
            // Borde blanco para la chincheta
            pdf.setDrawColor(255, 255, 255)
            pdf.setLineWidth(1)
            pdf.circle(mapX + mapWidth/2, mapY + mapHeight/2, 3)
            
            // Agregar título del mapa
            pdf.setTextColor(0, 0, 0)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'bold')
            pdf.text('UBICACIÓN', mapX + mapWidth/2, mapY - 5, { align: 'center' })
          } else {
            console.log('Error descargando tile de OpenStreetMap')
            // Fallback: mostrar coordenadas sin mapa
            pdf.setTextColor(0, 0, 0)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'bold')
            pdf.text('UBICACIÓN', 230, yPosition + 5, { align: 'center' })
            pdf.setFontSize(6)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Lat: ${support.latitude.toFixed(4)}`, 200, yPosition + 15)
            pdf.text(`Lng: ${support.longitude.toFixed(4)}`, 200, yPosition + 20)
          }
          
        } catch (error) {
          console.log('Error generando mapa OpenStreetMap:', error)
          // Fallback: mostrar coordenadas sin mapa
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'bold')
          pdf.text('UBICACIÓN', 230, yPosition + 5, { align: 'center' })
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Lat: ${support.latitude.toFixed(4)}`, 200, yPosition + 15)
          pdf.text(`Lng: ${support.longitude.toFixed(4)}`, 200, yPosition + 20)
        }
      }
      
      yPosition += 90
      
      // Línea separadora
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.line(20, yPosition, 277, yPosition)
      yPosition += 15
      
      // Código con etiqueta
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Código:', 20, yPosition)
      
      // Medir el ancho del código para hacer el recuadro proporcional
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      const codeWidth = pdf.getTextWidth(support.code) + 8
      pdf.setFillColor(240, 240, 240) // Gris claro
      pdf.roundedRect(20, yPosition - 8, codeWidth, 16, 3, 3, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.text(support.code, 20 + codeWidth/2, yPosition, { align: 'center' })
      
      // Estado con etiqueta (derecha)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Estado:', 150, yPosition)
      
      // Medir el ancho del estado para hacer el recuadro proporcional
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      const statusText = support.status.toUpperCase()
      const statusWidth = pdf.getTextWidth(statusText) + 8
      const statusColors = getStatusColors(support.status)
      pdf.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2])
      pdf.roundedRect(150, yPosition - 8, statusWidth, 16, 6, 6, 'F')
      pdf.setTextColor(statusColors.text[0], statusColors.text[1], statusColors.text[2])
      pdf.text(statusText, 150 + statusWidth/2, yPosition, { align: 'center' })
      
      yPosition += 25
      
      // Detalles en dos columnas
      const leftDetails = [
        `Tipo: ${support.type}`,
        `Ciudad: ${support.city}`,
        `Dimensiones: ${support.widthM}m × ${support.heightM}m`,
        `Área: ${support.areaM2}m²`
      ]
      
      const rightDetails = [
        `Precio Mensual: $${support.priceMonth?.toLocaleString() || 'N/A'}`,
        `Impactos Diarios: ${support.impactosDiarios?.toLocaleString() || 'N/A'}`,
        `Iluminación: ${support.lighting || 'No'}`
      ]
      
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'normal')
      
      // Columna izquierda
      leftDetails.forEach((detail, i) => {
        pdf.text(detail, 20, yPosition + i * 15)
      })
      
      // Columna derecha
      rightDetails.forEach((detail, i) => {
        pdf.text(detail, 150, yPosition + i * 15)
      })
      
      yPosition += Math.max(leftDetails.length, rightDetails.length) * 15 + 20
      
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
    
    // Agregar pie de página final
    addFooter(pdf)
    
    return Buffer.from(pdf.output('arraybuffer'))
  } catch (error) {
    console.error('Error en generatePDF:', error)
    throw error
  }
}
