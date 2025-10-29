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
      const footerY = 200 // Bajado al fondo de la hoja (210mm - 12mm = 198mm, pero 200 para estar seguro)
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, footerY, 297, 12, 'F') // Mantiene el mismo tamaño de 12mm
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.text(`© ${new Date().getFullYear()} Publicidad Vial Imagen | Generado el ${currentDate}`, 148.5, footerY + 7, { align: 'center' })
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
              // Aumentar tamaño de 120x80 a 130x90, más a la izquierda
              pdf.addImage(imageBase64, 'JPEG', 15, yPosition, 130, 90)
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
            
            // Agregar la imagen del mapa al PDF - Aumentada de tamaño y más cerca de la imagen principal
            const mapWidth = 130
            const mapHeight = 90
            const mapX = 155  // Más cerca de la imagen principal (15 + 130 + 10 = 155)
            const mapY = yPosition
            
            pdf.addImage(mapBase64, 'PNG', mapX, mapY, mapWidth, mapHeight)
            
            // Agregar enlace clickeable al mapa para Google Maps
            const googleMapsUrl = `https://www.google.com/maps?q=${support.latitude},${support.longitude}`
            pdf.link(mapX, mapY, mapWidth, mapHeight, { url: googleMapsUrl })
            
            // Agregar icono de valla publicitaria en el centro del mapa
            const iconSize = 12 // Tamaño del icono en mm
            const iconX = mapX + mapWidth/2 - iconSize/2
            const iconY = mapY + mapHeight/2 - iconSize/2
            
            // Dibujar icono de valla publicitaria usando formas geométricas
            // Color rojo vivo como el punto anterior
            const redColor = [255, 0, 0] // Rojo vivo #FF0000
            
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
            
            // Agregar indicador visual de que es clickeable
            pdf.setTextColor(0, 0, 255) // Azul para indicar enlace
            pdf.setFontSize(6)
            pdf.setFont('helvetica', 'normal')
            pdf.text('Clic para abrir en Google Maps', mapX + mapWidth/2, mapY + mapHeight + 3, { align: 'center' })
          } else {
            console.log('Error descargando tile de OpenStreetMap')
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
          
        } catch (error) {
          console.log('Error generando mapa OpenStreetMap:', error)
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
      pdf.line(20, yPosition, 277, yPosition)
      yPosition += 15 // Aumentado de 10 a 15 para más espacio
      
      // Información del espacio en 3 columnas (compactada)
      pdf.setFontSize(9) // Reducido de 10 a 9
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'normal')
      
      // Primera columna (izquierda)
      const col1X = 20
      const col1Fields = [
        `Código: ${support.code}`,
        `Ciudad: ${support.city}`,
        `Zona: `, // En blanco de momento
        `Período de alquiler: Mensual` // Siempre "Mensual"
      ]
      
      // Segunda columna (centro)
      const col2X = 120
      const col2Fields = [
        `Medidas: ${support.widthM}m × ${support.heightM}m`,
        `Sustrato de impresión: Lona`, // Siempre "Lona"
        `Tipo de soporte: ${support.type}`,
        `Iluminación: ${support.lighting || 'No'}`
      ]
      
      // Tercera columna (derecha)
      const col3X = 220
      const col3Fields = [
        `Divisa: Bs`, // Siempre "Bs"
        `Impactos diarios: ${support.impactosDiarios?.toLocaleString() || 'N/A'}`,
        `Costo de Producción: `, // En blanco de momento
        `Costo de alquiler: ${support.priceMonth?.toLocaleString() || 'N/A'} Bs`
      ]
      
      // Dibujar las 3 columnas con espaciado compacto
      const lineSpacing = 16 // Aumentado de 14 a 16 para más espacio
      col1Fields.forEach((field, i) => {
        pdf.text(field, col1X, yPosition + i * lineSpacing)
      })
      
      col2Fields.forEach((field, i) => {
        pdf.text(field, col2X, yPosition + i * lineSpacing)
      })
      
      col3Fields.forEach((field, i) => {
        pdf.text(field, col3X, yPosition + i * lineSpacing)
      })
      
      yPosition += col1Fields.length * lineSpacing + 15
      
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
