import jsPDF from 'jspdf'

// Función auxiliar para redondear a 2 decimales
function redondearADosDecimales(num: number): number {
  return Math.round(num * 100) / 100
}

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
  vendedorNumero?: string | null // Número de teléfono del usuario que descarga la cotización
  productos: ItemLista[]
  totalGeneral: number
  vigencia?: number | null // Días de validez
  plazo?: string | null // Plazo de entrega
  /** Si true, se convierte a USD con tipoCambio y se muestra $ en el PDF */
  enDolares?: boolean
  /** Tipo de cambio Bs/USD (ej. 6.96). Se muestra en la sección Información. Si enDolares, se usa para convertir importes. */
  tipoCambio?: number
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

/**
 * Carga una imagen desde URL y la comprime (misma estrategia que PDF soportes):
 * PNG sin transparencia / JPEG / WEBP → JPEG 89%.
 * PNG con transparencia → se mantiene PNG sin comprimir.
 * Reduce mucho el tamaño del PDF para poder enviarlo por email.
 */
async function loadAndCompressImage(imageUrl: string): Promise<{ base64: string | null; format: string }> {
  if (!imageUrl || imageUrl.startsWith('blob:')) {
    return { base64: null, format: 'JPEG' }
  }
  try {
    const imgResponse = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' })
    if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`)
    const imgBlob = await imgResponse.blob()
    if (!imgBlob.type.startsWith('image/')) throw new Error(`Tipo inválido: ${imgBlob.type}`)

    const isPNG = imgBlob.type.includes('png')
    const isWEBP = imgBlob.type.includes('webp')

    return await new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(imgBlob)
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        URL.revokeObjectURL(url)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve({ base64: null, format: 'JPEG' })
            return
          }
          ctx.drawImage(img, 0, 0)

          let hasAlpha = false
          if (isPNG) {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            for (let i = 3; i < data.length; i += 4) {
              if (data[i] < 255) {
                hasAlpha = true
                break
              }
            }
          }

          if (isPNG && !hasAlpha) {
            const jpeg = canvas.toDataURL('image/jpeg', 0.89)
            resolve({ base64: jpeg, format: 'JPEG' })
          } else if (imgBlob.type.includes('jpeg') || imgBlob.type.includes('jpg') || isWEBP) {
            const jpeg = canvas.toDataURL('image/jpeg', 0.89)
            resolve({ base64: jpeg, format: 'JPEG' })
          } else if (isPNG && hasAlpha) {
            const png = canvas.toDataURL('image/png')
            resolve({ base64: png, format: 'PNG' })
          } else {
            const jpeg = canvas.toDataURL('image/jpeg', 0.89)
            resolve({ base64: jpeg, format: 'JPEG' })
          }
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Error cargando imagen'))
      }
      img.src = url
    })
  } catch (error) {
    console.error('❌ Error cargando/comprimiendo imagen para PDF:', error)
    return { base64: null, format: 'JPEG' }
  }
}

// Función para formatear números con separador de miles y decimales (Bs)
function formatearNumero(numero: number): string {
  const numeroFormateado = numero.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${parteEnteraConSeparador},${parteDecimal} Bs`
}

// Formato USD (para cotización en dólares)
function formatearNumeroUSD(numero: number): string {
  const numeroFormateado = numero.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${parteEnteraConSeparador},${parteDecimal} $`
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

export async function generarPDFCotizacion(datos: DatosCotizacion): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const primaryColor: [number, number, number] = [190, 8, 18] // #be0812
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
    yPosition += logoHeight + 12 // Acercado más al logo (reducido de 18 a 12)
  } else {
    yPosition += 15 // Acercado más (reducido de 20 a 15)
  }

  // Código de cotización con estilo similar al listado (fondo gris, borde, monospace)
  const codigoX = 15 // Alineado a la izquierda
  const codigoPaddingX = 5 // Aumentado para mejor padding horizontal
  const codigoPaddingY = 3 // Aumentado para mejor padding vertical
  
  // Calcular ancho del texto para el tamaño del recuadro (en negrita)
  pdf.setFontSize(10) // Ligeramente más grande para que se note más
  pdf.setFont('courier', 'bold') // Negrita para que se note más
  const codigoWidth = pdf.getTextWidth(datos.codigo)
  const codigoHeight = 8 // Altura del badge aumentada para mejor centrado
  
  // Calcular posición Y del recuadro
  const codigoY = yPosition
  const recuadroWidth = codigoWidth + (codigoPaddingX * 2)
  
  // Dibujar fondo gris claro (bg-neutral-100)
  pdf.setFillColor(245, 245, 245) // neutral-100 aproximado
  pdf.setDrawColor(229, 229, 229) // neutral-200 para el borde
  pdf.setLineWidth(0.3)
  pdf.roundedRect(codigoX, codigoY, recuadroWidth, codigoHeight, 2, 2, 'FD') // FD = Fill + Draw
  
  // Texto del código en gris oscuro (text-gray-800) - centrado usando align: "center"
  pdf.setTextColor(31, 41, 55) // gray-800 aproximado
  // Centrado horizontal y vertical usando align: "center" (método confiable en jsPDF)
  // Ajuste vertical: +1 para centrado perfecto (equilibra el baseline de jsPDF)
  pdf.text(
    datos.codigo,
    codigoX + recuadroWidth / 2, // centro horizontal del recuadro
    codigoY + codigoHeight / 2 + 1, // centro vertical perfecto
    { align: "center" }
  )
  
  yPosition += codigoHeight + 10 // Espacio después del código (aumentado de 8 a 10)

  // Información (solo "Información")
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(12) // Más grande
  pdf.setFont('helvetica', 'bold')
  pdf.text('Información', 15, yPosition)
  
  yPosition += 7
  pdf.setFontSize(10) // Más grande
  pdf.setFont('helvetica', 'normal')
  
  // Fecha y Comercial en la primera línea (con más espacio entre ellos)
  let xPosition = 15
  pdf.text(`Fecha: ${currentDate}`, xPosition, yPosition)
  
  if (datos.vendedor) {
    const anchoFecha = pdf.getTextWidth(`Fecha: ${currentDate}`)
    const textoComercial = datos.vendedorNumero 
      ? `Comercial: ${datos.vendedor} - ${datos.vendedorNumero}`
      : `Comercial: ${datos.vendedor}`
    
    // Debug: verificar que el número se esté pasando
    console.log('📞 [generarPDFCotizacion] vendedor:', datos.vendedor)
    console.log('📞 [generarPDFCotizacion] vendedorNumero:', datos.vendedorNumero)
    console.log('📞 [generarPDFCotizacion] textoComercial:', textoComercial)
    
    // Verificar que el texto no se salga de la página
    const anchoTextoComercial = pdf.getTextWidth(textoComercial)
    const posicionInicioComercial = xPosition + anchoFecha + 15
    const anchoDisponible = pageWidth - posicionInicioComercial - 15 // Margen derecho
    
    if (anchoTextoComercial > anchoDisponible) {
      // Si el texto es muy largo, poner el número en la siguiente línea
      pdf.text(`Comercial: ${datos.vendedor}`, posicionInicioComercial, yPosition)
      if (datos.vendedorNumero) {
        yPosition += 5
        pdf.text(`Tel: ${datos.vendedorNumero}`, posicionInicioComercial, yPosition)
      }
    } else {
      pdf.text(textoComercial, posicionInicioComercial, yPosition)
    }
  }
  
  yPosition += 6
  
  // Cliente debajo de fecha, a la izquierda
  const textoCliente = `Cliente: ${datos.clienteNombreCompleto || datos.cliente}`
  pdf.text(textoCliente, xPosition, yPosition)
  yPosition += 6

  // Tipo de cambio solo en PDF en dólares (en Bs no se muestra)
  if (datos.enDolares) {
    const tcValor = datos.tipoCambio ?? 6.96
    pdf.text(`Tipo de cambio: ${tcValor.toFixed(2)}`, xPosition, yPosition)
    yPosition += 12
  }

  // Tabla de productos
  const enDolares = !!datos.enDolares
  const tc = datos.tipoCambio ?? 6.96
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
      
      if (hasImage && producto.imagen && !producto.imagen.startsWith('blob:')) {
        const loaded = await loadAndCompressImage(producto.imagen)
        imgBase64 = loaded.base64
        imgType = loaded.format as 'JPEG' | 'PNG'
      } else if (hasImage && (!producto.imagen || producto.imagen.startsWith('blob:'))) {
        console.error('❌ Imagen inválida o blob, omitiendo en PDF:', producto.imagen?.substring(0, 50) || 'null')
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
      
      // CALCULAR Precio Unitario desde el Total del ERP
      // 
      // REGLA CRÍTICA: El PDF NUNCA recalcula precios. Usa los valores del ERP.
      // El precio unitario se deriva del total para garantizar consistencia matemática:
      // Precio Unitario = Total / Cantidad (redondeado a 2 decimales)
      //
      // Esto garantiza que: Precio Unitario × Cantidad = Total (siempre)
      // y elimina diferencias de redondeo entre ERP y PDF.
      //
      // El total (producto.total) viene del ERP y ya incluye:
      // - Precio base
      // - Comisión (si aplica)
      // - Impuestos IVA/IT (si aplican)
      // - Descuentos (si no tiene IVA/IT)
      const totalBs = producto.total
      const totalMostrar = enDolares ? redondearADosDecimales(totalBs / tc) : totalBs
      const precioUnitarioCalculado = producto.cantidad > 0
        ? redondearADosDecimales(totalMostrar / producto.cantidad)
        : 0
      
      // Precio unitario y Total: Bs o USD según enDolares
      const precioUnitTexto = enDolares ? formatearNumeroUSD(precioUnitarioCalculado) : formatearNumero(precioUnitarioCalculado)
      const precioTotalTexto = enDolares ? formatearNumeroUSD(totalMostrar) : formatearNumero(totalBs)
      
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

  // Total como una fila más de la tabla (misma altura que el header de Descripción: 9)
  const totalRowHeight = 9
  
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
  
  // Texto en blanco (centrado verticalmente igual que el header)
  const totalGeneralMostrar = enDolares ? redondearADosDecimales(datos.totalGeneral / tc) : datos.totalGeneral
  const totalTexto = enDolares ? formatearNumeroUSD(totalGeneralMostrar) : formatearNumero(datos.totalGeneral)
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('TOTAL:', tableX + 3, yPosition + 6)
  pdf.text(totalTexto, tableX + tableWidth - 3, yPosition + 6, { align: 'right' })
  
  // Resetear color de texto
  pdf.setTextColor(0, 0, 0)

  // Agregar información de validez y plazo de entrega después de la tabla
  yPosition += totalRowHeight + 10 // Espacio después del total
  
  // Verificar si hay espacio suficiente, si no, nueva página
  if (yPosition + 20 > 270) {
    pdf.addPage()
    yPosition = 20
  }
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  // Validez - siempre mostrar (usar valor por defecto si no existe)
  const vigenciaValor = datos.vigencia ?? 30
  pdf.text(`Validez: ${vigenciaValor} días`, tableX, yPosition)
  yPosition += 7
  
  // Plazo de entrega - mostrar siempre (con texto por defecto si no existe)
  const plazoTexto = datos.plazo && datos.plazo.trim() !== '' ? datos.plazo : 'A convenir'
  pdf.text(`Plazo de Entrega: ${plazoTexto}`, tableX, yPosition)
  yPosition += 7

  // Agregar footers con paginación a todas las páginas
  const totalPages = pdf.getNumberOfPages()
  const pageHeight = 297 // Altura total de una página A4
  const footerHeight = 12 // Similar a la altura de la fila de total
  const footerY = pageHeight - footerHeight // Al final de la página, sin espacio blanco debajo
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    
    // Fondo rojo del footer
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, footerY, 210, footerHeight, 'F')
    
    // Texto en blanco
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    // Distribuir el footer con separadores (ajustado para altura menor)
    const footerTextY = footerY + (footerHeight / 2) + 2 // Centrado verticalmente
    // Izquierda: 2025 Publicidad Vial Imagen
    pdf.text(`${currentYear} Publicidad Vial Imagen`, 5, footerTextY)
    
    // Separador 1 (entre izquierda y centro)
    pdf.text('|', 65, footerTextY)
    
    // Centro: publicidadvialimagen.com (movido más a la izquierda)
    pdf.text('publicidadvialimagen.com', 70, footerTextY)
    
    // Separador 2 (entre web y email/número)
    const webTextWidth = pdf.getTextWidth('publicidadvialimagen.com')
    const separator2X = 70 + webTextWidth + 5
    pdf.text('|', separator2X, footerTextY)
    
    // Email y número del usuario que descarga (si existen)
    let rightContentX = separator2X + 5
    const emailFooter = obtenerEmailFooter(datos.vendedorEmail)
    if (emailFooter) {
      pdf.text(emailFooter, rightContentX, footerTextY)
      rightContentX += pdf.getTextWidth(emailFooter) + 5
      
      // Separador entre email y número
      if (datos.vendedorNumero) {
        pdf.text('|', rightContentX, footerTextY)
        rightContentX += 5
      }
    }
    
    // Número de teléfono (si existe)
    if (datos.vendedorNumero) {
      pdf.text(datos.vendedorNumero, rightContentX, footerTextY)
      rightContentX += pdf.getTextWidth(datos.vendedorNumero) + 5
    }
    
    // Separador final (antes de paginación) si hay email o número
    // Asegurar que haya al menos 15mm de espacio para la paginación
    const paginationStartX = 195
    if (rightContentX < paginationStartX - 5) {
      pdf.text('|', paginationStartX - 5, footerTextY)
    }
    
    // Extremo derecho: Paginación
    pdf.text(`${i}/${totalPages}`, 205, footerTextY, { align: 'right' })
  }

  const nombreArchivo = datos.enDolares ? `${datos.codigo}-USD.pdf` : `${datos.codigo}.pdf`
  pdf.save(nombreArchivo)
}

export async function generarPDFOT(datos: DatosCotizacion): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const primaryColor: [number, number, number] = [190, 8, 18] // #be0812
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
    yPosition += logoHeight + 12 // Acercado más al logo (reducido de 18 a 12)
  } else {
    yPosition += 15 // Acercado más (reducido de 20 a 15)
  }

  // Código de cotización con estilo similar al listado (fondo gris, borde, monospace)
  const codigoX = 15 // Alineado a la izquierda
  const codigoPaddingX = 5 // Aumentado para mejor padding horizontal
  const codigoPaddingY = 3 // Aumentado para mejor padding vertical
  
  // Calcular ancho del texto para el tamaño del recuadro (en negrita)
  pdf.setFontSize(10) // Ligeramente más grande para que se note más
  pdf.setFont('courier', 'bold') // Negrita para que se note más
  const codigoWidth = pdf.getTextWidth(datos.codigo)
  const codigoHeight = 8 // Altura del badge aumentada para mejor centrado
  
  // Calcular posición Y del recuadro
  const codigoY = yPosition
  const recuadroWidth = codigoWidth + (codigoPaddingX * 2)
  
  // Dibujar fondo gris claro (bg-neutral-100)
  pdf.setFillColor(245, 245, 245) // neutral-100 aproximado
  pdf.setDrawColor(229, 229, 229) // neutral-200 para el borde
  pdf.setLineWidth(0.3)
  pdf.roundedRect(codigoX, codigoY, recuadroWidth, codigoHeight, 2, 2, 'FD') // FD = Fill + Draw
  
  // Texto del código en gris oscuro (text-gray-800) - centrado usando align: "center"
  pdf.setTextColor(31, 41, 55) // gray-800 aproximado
  // Centrado horizontal y vertical usando align: "center" (método confiable en jsPDF)
  // Ajuste vertical: +1 para centrado perfecto (equilibra el baseline de jsPDF)
  pdf.text(
    datos.codigo,
    codigoX + recuadroWidth / 2, // centro horizontal del recuadro
    codigoY + codigoHeight / 2 + 1, // centro vertical perfecto
    { align: "center" }
  )
  
  yPosition += codigoHeight + 10 // Espacio después del código (aumentado de 8 a 10)

  // Información (solo "Información")
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(12) // Más grande
  pdf.setFont('helvetica', 'bold')
  pdf.text('Información', 15, yPosition)
  
  yPosition += 7
  pdf.setFontSize(10) // Más grande
  pdf.setFont('helvetica', 'normal')
  
  // Fecha y Comercial en la primera línea (con más espacio entre ellos)
  let xPosition = 15
  pdf.text(`Fecha: ${currentDate}`, xPosition, yPosition)
  
  if (datos.vendedor) {
    const anchoFecha = pdf.getTextWidth(`Fecha: ${currentDate}`)
    const textoComercial = datos.vendedorNumero 
      ? `Comercial: ${datos.vendedor} - ${datos.vendedorNumero}`
      : `Comercial: ${datos.vendedor}`
    pdf.text(textoComercial, xPosition + anchoFecha + 15, yPosition)
  }
  
  yPosition += 6
  
  // Cliente debajo de fecha, a la izquierda
  const textoCliente = `Cliente: ${datos.clienteNombreCompleto || datos.cliente}`
  pdf.text(textoCliente, xPosition, yPosition)
  
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
  // Descripción, Ancho, Alto, Cant (SIN P.Unit y P.Total)
  const colWidths = [120, 25, 25, 20] // Columnas más anchas, especialmente descripción
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0) // Ancho total = suma de columnas
  
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
  
  // Textos del encabezado (SIN P.Unit y P.Total)
  pdf.text('Descripción', tableX + 2, yPosition + 6)
  pdf.text('Ancho', tableX + colWidths[0] + 2, yPosition + 6)
  pdf.text('Alto', tableX + colWidths[0] + colWidths[1] + 2, yPosition + 6)
  pdf.text('Cant.', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPosition + 6)
  
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
      
      if (hasImage && producto.imagen && !producto.imagen.startsWith('blob:')) {
        const loaded = await loadAndCompressImage(producto.imagen)
        imgBase64 = loaded.base64
        imgType = loaded.format as 'JPEG' | 'PNG'
      } else if (hasImage && (!producto.imagen || producto.imagen.startsWith('blob:'))) {
        console.error('❌ Imagen inválida o blob, omitiendo en PDF:', producto.imagen?.substring(0, 50) || 'null')
      }
      
      // Calcular altura necesaria para el título
      // Ancho real de la columna menos márgenes amplios para asegurar que no se salga
      const descripcionAncho = colWidths[0] - 8 // 100 - 8 = 92mm (más margen de seguridad)
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

  // Agregar footers con paginación a todas las páginas
  const totalPages = pdf.getNumberOfPages()
  const pageHeight = 297 // Altura total de una página A4
  const footerHeight = 12 // Similar a la altura de la fila de total
  const footerY = pageHeight - footerHeight // Al final de la página, sin espacio blanco debajo
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    
    // Fondo rojo del footer
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, footerY, 210, footerHeight, 'F')
    
    // Texto en blanco
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    // Distribuir el footer con separadores (ajustado para altura menor)
    const footerTextY = footerY + (footerHeight / 2) + 2 // Centrado verticalmente
    // Izquierda: 2025 Publicidad Vial Imagen
    pdf.text(`${currentYear} Publicidad Vial Imagen`, 5, footerTextY)
    
    // Separador 1 (entre izquierda y centro)
    pdf.text('|', 70, footerTextY)
    
    // Centro (centrado en la página): publicidadvialimagen.com
    pdf.text('publicidadvialimagen.com', 105, footerTextY, { align: 'center' })
    
    // Separador 2 (entre centro y derecha)
    pdf.text('|', 140, footerTextY)
    
    // Derecha (antes de la paginación): email (si existe)
    const emailFooter = obtenerEmailFooter(datos.vendedorEmail)
    if (emailFooter) {
      pdf.text(emailFooter, 145, footerTextY)
    }
    
    // Separador 3 (entre email y paginación)
    if (emailFooter) {
      pdf.text('|', 190, footerTextY)
    }
    
    // Extremo derecho: Paginación
    pdf.text(`${i}/${totalPages}`, 205, footerTextY, { align: 'right' })
  }

  const nombreArchivo = `OT-${datos.codigo}.pdf`
  pdf.save(nombreArchivo)
}

