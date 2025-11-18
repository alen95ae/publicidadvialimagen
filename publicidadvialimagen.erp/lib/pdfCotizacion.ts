import jsPDF from 'jspdf'

interface ProductoItem {
  id: string
  tipo: 'producto'
  producto: string
  descripcion: string
  cantidad: number
  ancho: number
  alto: number
  totalM2: number
  udm: string
  precio: number
  comision: number
  conIVA: boolean
  conIT: boolean
  total: number
  esSoporte?: boolean
  dimensionesBloqueadas?: boolean
  imagen?: string
}

interface NotaItem {
  id: string
  tipo: 'nota'
  texto: string
}

interface SeccionItem {
  id: string
  tipo: 'seccion'
  texto: string
}

type ItemLista = ProductoItem | NotaItem | SeccionItem

interface DatosCotizacion {
  codigo: string
  cliente: string
  clienteNombreCompleto?: string
  sucursal: string // Se usa para determinar qué dirección mostrar
  vendedor: string
  vendedorEmail?: string // Email del comercial
  productos: ItemLista[]
  totalGeneral: number
}

// Función auxiliar para cargar el logo
async function cargarLogo(): Promise<string | null> {
  try {
    const response = await fetch('/logo.jpg')
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error cargando logo:', error)
    return null
  }
}

// Función para formatear números con separador de miles y decimales
function formatearNumero(numero: number): string {
  // Formatear con 2 decimales
  const numeroFormateado = numero.toFixed(2)
  
  // Separar parte entera y decimal
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  
  // Agregar separador de miles (punto)
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  // Devolver con formato: 1.164.026,00 Bs
  return `${parteEnteraConSeparador},${parteDecimal} Bs`
}

export async function generarPDFCotizacion(datos: DatosCotizacion): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const primaryColor: [number, number, number] = [213, 70, 68]
  const currentDate = new Date().toLocaleDateString('es-ES')
  const currentYear = new Date().getFullYear()
  
  let yPosition = 10

  // Cargar y agregar logo (lado izquierdo)
  const logoBase64 = await cargarLogo()
  if (logoBase64) {
    const aspectRatio = 24 / 5.5
    const maxHeight = 10 // Logo más grande
    const calculatedWidth = maxHeight * aspectRatio
    const logoWidth = Math.min(calculatedWidth, 45)
    const logoHeight = logoWidth / aspectRatio
    
    pdf.addImage(logoBase64, 'JPEG', 15, yPosition, logoWidth, logoHeight)
  }
  
  // Dirección de la sucursal (lado derecho)
  pdf.setTextColor(0, 0, 0)
  const pageWidth = 210 // A4 width
  
  // Nombre de la empresa en negrita
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Publicidad Vial Imagen S.R.L.', pageWidth - 15, yPosition + 1, { align: 'right' })
  
  // Dirección en texto normal
  pdf.setFont('helvetica', 'normal')
  
  let direccionLinea1 = ''
  let direccionLinea2 = ''
  let ciudadLinea = ''
  
  if (datos.sucursal === 'La Paz' || datos.sucursal === '1') {
    direccionLinea1 = 'C. Nicolás Acosta Esq. Pedro Blanco'
    direccionLinea2 = '(Alto San Pedro) N° 1471'
    ciudadLinea = 'La Paz'
  } else if (datos.sucursal === 'Santa Cruz' || datos.sucursal === '2') {
    direccionLinea1 = 'Avenida 2 de Agosto, Calle 6'
    direccionLinea2 = '(Entre 4 y 5 Anillo) N° 27'
    ciudadLinea = 'Santa Cruz'
  }
  
  if (direccionLinea1) {
    pdf.text(direccionLinea1, pageWidth - 15, yPosition + 5, { align: 'right' })
    pdf.text(direccionLinea2, pageWidth - 15, yPosition + 9, { align: 'right' })
    pdf.text(ciudadLinea, pageWidth - 15, yPosition + 13, { align: 'right' })
  }
  
  if (logoBase64) {
    const aspectRatio = 24 / 5.5
    const maxHeight = 10
    const calculatedWidth = maxHeight * aspectRatio
    const logoWidth = Math.min(calculatedWidth, 45)
    const logoHeight = logoWidth / aspectRatio
    yPosition += logoHeight + 10 // Más espacio después del logo
  } else {
    yPosition += 15
  }

  // Código de cotización en rojo (primaryColor) - MÁS ABAJO con más espacio
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  pdf.setFontSize(14) // Más grande
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Cotización: ${datos.codigo}`, 15, yPosition)
  
  yPosition += 12

  // Información (solo "Información")
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(12) // Más grande
  pdf.setFont('helvetica', 'bold')
  pdf.text('Información', 15, yPosition)
  
  yPosition += 7
  pdf.setFontSize(10) // Más grande
  pdf.setFont('helvetica', 'normal')
  
  // Todos los datos en la misma fila
  let xPosition = 15
  pdf.text(`Cliente: ${datos.clienteNombreCompleto || datos.cliente}`, xPosition, yPosition)
  xPosition += 75
  
  // Fecha donde antes estaba Sucursal
  pdf.text(`Fecha: ${currentDate}`, xPosition, yPosition)
  xPosition += 45

  if (datos.vendedor) {
    pdf.text(`Comercial: ${datos.vendedor}`, xPosition, yPosition)
  }
  
  yPosition += 12

  // Tabla de productos
  pdf.setFontSize(12) // Más grande
  pdf.setFont('helvetica', 'bold')
  pdf.text('Detalle', 15, yPosition)
  yPosition += 7

  // Encabezado de tabla - BLANCO (sin fondo gris)
  pdf.setDrawColor(180, 180, 180)
  pdf.setLineWidth(0.2)
  
  const tableX = 15 // Menos margen
  const tableWidth = 180 // Tabla más ancha
  // Descripción, Ancho, Alto, Cant, P.Unit (más ancho), P.Total (más ancho)
  const colWidths = [70, 15, 15, 12, 34, 34] // Más espacio para precios, menos para dimensiones
  
  pdf.setFontSize(9) // Más grande
  pdf.setFont('helvetica', 'bold')
  
  // Dibujar líneas verticales del encabezado
  let currentX = tableX
  for (let i = 0; i <= colWidths.length; i++) {
    pdf.line(currentX, yPosition, currentX, yPosition + 9) // Header más alto
    if (i < colWidths.length) {
      currentX += colWidths[i]
    }
  }
  
  // Líneas horizontales del encabezado
  pdf.line(tableX, yPosition, tableX + tableWidth, yPosition)
  pdf.line(tableX, yPosition + 9, tableX + tableWidth, yPosition + 9)
  
  // Textos del encabezado
  pdf.text('Descripción', tableX + 2, yPosition + 6)
  pdf.text('Ancho', tableX + colWidths[0] + 2, yPosition + 6)
  pdf.text('Alto', tableX + colWidths[0] + colWidths[1] + 2, yPosition + 6)
  pdf.text('Cant.', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPosition + 6)
  pdf.text('P. Unit.', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPosition + 6)
  pdf.text('P. Total', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPosition + 6)
  
  yPosition += 9

  // Productos
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9) // Texto más grande en productos
  
  for (const item of datos.productos) {
    if (yPosition > 240) {
      pdf.addPage()
      yPosition = 20
    }

    if (item.tipo === 'producto') {
      const producto = item as ProductoItem
      const rowStartY = yPosition
      
      // Si hay imagen, cargarla
      let imgBase64: string | null = null
      let imgType = 'JPEG'
      const hasImage = !!producto.imagen
      
      if (hasImage) {
        try {
          const imgResponse = await fetch(producto.imagen!)
          const imgBlob = await imgResponse.blob()
          imgBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(imgBlob)
          })
          imgType = imgBlob.type.includes('png') ? 'PNG' : 'JPEG'
        } catch (error) {
          console.error('Error cargando imagen del producto:', error)
        }
      }
      
      // Calcular altura necesaria para el título
      // Ancho real de la columna menos márgenes amplios para asegurar que no se salga
      const descripcionAncho = colWidths[0] - 8 // 70 - 8 = 62mm (más margen de seguridad)
      const descripcionLineas = pdf.splitTextToSize(producto.descripcion || producto.producto, descripcionAncho)
      const alturaTexto = descripcionLineas.length * 5 + 2 // Más espacio entre líneas
      
      // Calcular altura total de la fila: texto + imagen (si existe)
      const imgSize = 25
      const alturaImagen = hasImage && imgBase64 ? imgSize + 2 : 0
      const rowHeight = Math.max(alturaTexto + alturaImagen, 8)
      
      // Verificar si hay espacio suficiente
      if (yPosition + rowHeight > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Fondo blanco (sin color)
      pdf.setFillColor(255, 255, 255)
      
      // Dibujar celdas con bordes
      currentX = tableX
      for (let i = 0; i < colWidths.length; i++) {
        pdf.rect(currentX, yPosition, colWidths[i], rowHeight)
        currentX += colWidths[i]
      }
      
      // Textos - Título en la parte superior de la celda
      pdf.setFontSize(9)
      const tituloY = yPosition + 4
      pdf.text(descripcionLineas, tableX + 2, tituloY)
      
      // Si hay imagen, colocarla DEBAJO del título en la MISMA celda
      if (hasImage && imgBase64) {
        const imgY = yPosition + alturaTexto + 1
        const imgX = tableX + 2
        pdf.addImage(imgBase64, imgType, imgX, imgY, imgSize, imgSize)
      }
      
      // Ancho y Alto: formatear solo si son mayores a 0 - centrados verticalmente
      const datosY = yPosition + (rowHeight / 2) + 1
      pdf.setFontSize(8)
      pdf.text(producto.ancho > 0 ? producto.ancho.toFixed(2).replace('.', ',') : '-', tableX + colWidths[0] + 2, datosY)
      pdf.text(producto.alto > 0 ? producto.alto.toFixed(2).replace('.', ',') : '-', tableX + colWidths[0] + colWidths[1] + 2, datosY)
      // Cantidad: solo mostrar el número
      pdf.text(producto.cantidad.toString(), tableX + colWidths[0] + colWidths[1] + colWidths[2] + 2, datosY)
      
      // CALCULAR Precio Unitario SOLO para el PDF (no viene de BD)
      const precioUnitarioCalculado = producto.esSoporte 
        ? producto.precio 
        : (producto.precio * producto.ancho * producto.alto)
      
      // Precio unitario y Total: usar formato completo
      const precioUnitTexto = formatearNumero(precioUnitarioCalculado)
      const precioTotalTexto = formatearNumero(producto.total)
      
      // Ajustar texto dentro de la celda para que no se salga
      const precioUnitLineas = pdf.splitTextToSize(precioUnitTexto, colWidths[4] - 6)
      const precioTotalLineas = pdf.splitTextToSize(precioTotalTexto, colWidths[5] - 6)
      
      pdf.text(precioUnitLineas, tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, datosY)
      pdf.text(precioTotalLineas, tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, datosY)
      
      yPosition += rowHeight
      
    } else if (item.tipo === 'nota') {
      const nota = item as NotaItem
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(9) // Mismo tamaño que productos
      // Ancho de la tabla menos márgenes
      const notaLineas = pdf.splitTextToSize(`Nota: ${nota.texto}`, tableWidth - 6)
      const rowHeight = notaLineas.length * 4.5 + 4
      
      // Dibujar celda para la nota (ocupa todo el ancho)
      pdf.rect(tableX, yPosition, tableWidth, rowHeight)
      pdf.text(notaLineas, tableX + 3, yPosition + 5)
      
      yPosition += rowHeight
      pdf.setFont('helvetica', 'normal')
    } else if (item.tipo === 'seccion') {
      const seccion = item as SeccionItem
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10) // Más grande para secciones
      
      // Ajustar texto al ancho de la tabla
      const seccionLineas = pdf.splitTextToSize(seccion.texto, tableWidth - 6)
      const rowHeight = Math.max(seccionLineas.length * 5 + 4, 9)
      
      // Fondo gris para secciones
      pdf.setFillColor(240, 240, 240)
      pdf.rect(tableX, yPosition, tableWidth, rowHeight, 'F')
      
      // Borde
      pdf.rect(tableX, yPosition, tableWidth, rowHeight)
      
      pdf.text(seccionLineas, tableX + 3, yPosition + 6)
      
      yPosition += rowHeight
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9) // Volver al tamaño normal
    }
  }

  // Total como una fila más de la tabla
  const totalRowHeight = 12
  
  // Verificar si hay espacio suficiente
  if (yPosition + totalRowHeight > 270) {
    pdf.addPage()
    yPosition = 20
  }
  
  // Fondo rojo para toda la fila
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  pdf.rect(tableX, yPosition, tableWidth, totalRowHeight, 'F')
  
  // Borde de la fila del total
  pdf.setDrawColor(180, 180, 180)
  pdf.rect(tableX, yPosition, tableWidth, totalRowHeight)
  
  // Texto en blanco
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('TOTAL:', tableX + 3, yPosition + 8)
  pdf.text(formatearNumero(datos.totalGeneral), tableX + tableWidth - 3, yPosition + 8, { align: 'right' })
  
  // Resetear color de texto
  pdf.setTextColor(0, 0, 0)

  // Agregar footers con paginación a todas las páginas
  const totalPages = pdf.getNumberOfPages()
  const footerY = 280
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    
    // Fondo rojo del footer
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, footerY, 210, 17, 'F')
    
    // Texto en blanco
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    // Distribuir el footer con separadores
    // Izquierda: © 2025 Publicidad Vial Imagen
    pdf.text(`© ${currentYear} Publicidad Vial Imagen`, 5, footerY + 10)
    
    // Separador 1 (entre izquierda y centro)
    pdf.text('|', 70, footerY + 10)
    
    // Centro (centrado en la página): publicidadvialimagen.com
    pdf.text('publicidadvialimagen.com', 105, footerY + 10, { align: 'center' })
    
    // Separador 2 (entre centro y derecha)
    pdf.text('|', 140, footerY + 10)
    
    // Derecha (antes de la paginación): email (si existe)
    if (datos.vendedorEmail) {
      pdf.text(datos.vendedorEmail, 145, footerY + 10)
    }
    
    // Separador 3 (entre email y paginación)
    if (datos.vendedorEmail) {
      pdf.text('|', 190, footerY + 10)
    }
    
    // Extremo derecho: Paginación
    pdf.text(`${i}/${totalPages}`, 205, footerY + 10, { align: 'right' })
  }

  const nombreArchivo = `cotizacion-${datos.codigo}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(nombreArchivo)
}

