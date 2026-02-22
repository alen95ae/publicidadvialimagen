"use client"

import { useState, useEffect, useLayoutEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Loader2, Ruler, Package, Calculator, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/hooks/use-translations"

interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen_portada?: string | null
  categoria: string
  unidad_medida: string
  precio_venta: number
  coste: number
  variantes: any[]
  variantes_detalle: Array<{
    id: string
    combinacion: string
    precio_override: number | null
    precio_calculado: number | null
    coste_override: number | null
    coste_calculado: number | null
  }>
}

interface ProductoDetailPageProps {
  params: {
    id: string
  }
}

// Mapeo de nombres de colores a códigos hex
const colorMap: Record<string, string> = {
  'blanco': '#FFFFFF',
  'negro': '#000000',
  'rojo': '#FF0000',
  'azul': '#0000FF',
  'verde': '#00FF00',
  'amarillo': '#FFFF00',
  'naranja': '#FFA500',
  'rosa': '#FFC0CB',
  'morado': '#800080',
  'gris': '#808080',
  'marron': '#A52A2A',
  'beige': '#F5F5DC',
  'dorado': '#FFD700',
  'plateado': '#C0C0C0',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'turquesa': '#40E0D0',
  'coral': '#FF7F50',
  'lila': '#C8A2C8',
  'ocre': '#CC7722',
  'verde lima': '#32CD32',
  'azul marino': '#000080',
  'verde oliva': '#808000',
  'salmon': '#FA8072',
  'tomate': '#FF6347',
  'oro': '#FFD700',
  'plata': '#C0C0C0',
}

// Función para obtener código hex de un color
const obtenerColorHex = (nombreColor: string): string => {
  if (!nombreColor) return '#CCCCCC'
  
  const nombreLimpio = nombreColor.trim()
  
  // Si ya es un código hex, retornarlo
  if (/^#[0-9A-Fa-f]{6}$/i.test(nombreLimpio)) {
    return nombreLimpio.toUpperCase()
  }
  
  // Si tiene formato "Nombre:#hex", extraer el hex (PRIORITARIO - usar el hex del ERP)
  if (nombreLimpio.includes(':')) {
    const partes = nombreLimpio.split(':')
    // Buscar la última parte que sea un código hex válido
    for (let i = partes.length - 1; i >= 0; i--) {
      const hexPart = partes[i].trim()
      if (/^#[0-9A-Fa-f]{6}$/i.test(hexPart)) {
        return hexPart.toUpperCase()
      }
    }
  }
  
  // Si no tiene formato "Nombre:#hex", buscar en el mapeo por nombre
  const nombreLower = nombreLimpio.toLowerCase()
  return colorMap[nombreLower] || '#CCCCCC'
}

// Función para detectar si una variante es de colores
const esVarianteColor = (valores: string[]): boolean => {
  if (!valores || valores.length === 0) return false
  
  // Contar cuántos valores son colores reconocidos
  let coloresReconocidos = 0
  valores.forEach((valor: string) => {
    const nombreLimpio = valor.toLowerCase().trim()
    // Si es código hex
    if (/^#[0-9A-Fa-f]{6}$/.test(nombreLimpio)) {
      coloresReconocidos++
      return
    }
    // Si tiene formato "Nombre:#hex"
    if (nombreLimpio.includes(':')) {
      const partes = nombreLimpio.split(':')
      if (partes.length === 2 && /^#[0-9A-Fa-f]{6}$/i.test(partes[1].trim())) {
        coloresReconocidos++
        return
      }
    }
    // Si está en el mapeo de colores
    if (colorMap[nombreLimpio]) {
      coloresReconocidos++
      return
    }
    // Si el nombre contiene palabras relacionadas con color
    const palabrasColor = ['blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'rosa', 'morado', 'gris', 'marron', 'beige', 'dorado', 'plateado', 'cyan', 'magenta', 'turquesa', 'coral', 'lila', 'ocre', 'verde', 'azul', 'salmon', 'tomate', 'oro', 'plata', 'brillo', 'mate']
    if (palabrasColor.some(palabra => nombreLimpio.includes(palabra))) {
      coloresReconocidos++
    }
  })
  
  // Si más del 50% de los valores son colores, considerarlo variante de color
  return coloresReconocidos > valores.length * 0.5
}

export default function ProductoDetailPage({ params }: ProductoDetailPageProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado del formulario
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Record<string, string>>({})
  const [cantidad, setCantidad] = useState<number>(1)
  const [ancho, setAncho] = useState<number>(0)
  const [alto, setAlto] = useState<number>(0)
  
  // Scroll al inicio
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Cargar producto
  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/productos/${params.id}`, {
          cache: 'no-store',
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar producto')
        }
        
        setProducto(data.data)
        
        // Extraer variantes desde variantes_detalle si no vienen en variantes
        let variantesExtraidas: any[] = []
        if (data.data.variantes && Array.isArray(data.data.variantes) && data.data.variantes.length > 0) {
          variantesExtraidas = data.data.variantes
        } else if (data.data.variantes_detalle && data.data.variantes_detalle.length > 0) {
          // Extraer variantes desde las combinaciones
          const variantesMap = new Map<string, Set<string>>()
          data.data.variantes_detalle.forEach((v: any) => {
            if (v.combinacion) {
              const partes = v.combinacion.split('|')
              partes.forEach((parte: string) => {
                const [key, value] = parte.split(':')
                if (key && value && !key.toLowerCase().includes('sucursal')) {
                  if (!variantesMap.has(key)) {
                    variantesMap.set(key, new Set())
                  }
                  variantesMap.get(key)!.add(value)
                }
              })
            }
          })
          variantesExtraidas = Array.from(variantesMap.entries()).map(([nombre, valores]) => ({
            nombre,
            valores: Array.from(valores).sort()
          }))
        }
        
        // Inicializar selecciones por defecto
        if (variantesExtraidas.length > 0) {
          const iniciales: Record<string, string> = {}
          variantesExtraidas.forEach((v: any) => {
            if (v.valores && v.valores.length > 0) {
              iniciales[v.nombre] = v.valores[0]
            }
          })
          setVariantesSeleccionadas(iniciales)
        }
      } catch (err) {
        console.error('Error cargando producto:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar producto')
      } finally {
        setLoading(false)
      }
    }
    
    cargarProducto()
  }, [params.id])
  
  // Obtener precio según variantes seleccionadas
  const obtenerPrecio = (): number => {
    if (!producto) return 0
    
    // Buscar la variante que coincida con las selecciones actuales
    if (producto.variantes_detalle && Object.keys(variantesSeleccionadas).length > 0) {
      // Construir combinación de búsqueda
      const combinacionBuscada = Object.entries(variantesSeleccionadas)
        .filter(([key]) => !key.toLowerCase().includes('sucursal'))
        .map(([key, value]) => `${key}:${value}`)
        .join('|')
      
      // Buscar variante exacta
      let variante = producto.variantes_detalle.find(v => {
        const combinacionLimpia = v.combinacion
          .split('|')
          .filter(p => !p.toLowerCase().includes('sucursal'))
          .join('|')
        return combinacionLimpia === combinacionBuscada
      })
      
      // Si no se encuentra exacta, buscar parcial
      if (!variante) {
        variante = producto.variantes_detalle.find(v => {
          const partes = v.combinacion.split('|')
          return Object.entries(variantesSeleccionadas)
            .filter(([key]) => !key.toLowerCase().includes('sucursal'))
            .every(([key, value]) => {
              const parte = partes.find(p => p.startsWith(`${key}:`))
              return parte && parte.split(':')[1] === value
            })
        })
      }
      
      if (variante) {
        // Priorizar precio_override, luego precio_calculado, luego precio base
        if (variante.precio_override !== null && variante.precio_override !== undefined) {
          return variante.precio_override
        }
        if (variante.precio_calculado !== null && variante.precio_calculado !== undefined) {
          return variante.precio_calculado
        }
      }
    }
    
    // Usar precio base del producto
    return producto.precio_venta || 0
  }
  
  // Calcular área total en m² (sin redondear)
  // Nota: ancho y alto ya vienen en metros desde el input
  const calcularAreaTotalM2 = (): number => {
    if (ancho <= 0 || alto <= 0 || cantidad <= 0) return 0
    
    // 1. Las dimensiones ya están en metros (no hay conversión)
    const ancho_m = ancho
    const alto_m = alto
    
    // 2. Calcular área unitaria en m²
    const area_m2 = ancho_m * alto_m
    
    // 3. Calcular área total en m² (área unitaria × cantidad)
    const area_total_m2 = area_m2 * cantidad
    
    return area_total_m2
  }
  
  // Calcular total según unidad de medida
  const calcularTotal = (): number => {
    if (!producto) return 0
    
    const precio_m2 = obtenerPrecio() // Precio por m² del ERP (no se muestra)
    const udm = producto.unidad_medida?.toLowerCase().trim() || ''
    
    // Si es m², calcular según reglas de impresión digital
    if (udm === 'm²' || udm === 'm2' || udm === 'metro cuadrado' || udm === 'metros cuadrados') {
      if (ancho <= 0 || alto <= 0 || cantidad <= 0) return 0
      
      // Calcular área total (sin redondear)
      const area_total_m2 = calcularAreaTotalM2()
      
      // 4. Calcular total: área_total_m2 × precio_m2
      const total = area_total_m2 * precio_m2
      
      return total
    }
    
    // Si es unidad/unidades, calcular: cantidad × precio
    if (udm === 'unidad' || udm === 'unidades' || udm === 'unidade') {
      if (cantidad <= 0) return 0
      return cantidad * precio_m2
    }
    
    // Por defecto: cantidad × precio
    if (cantidad <= 0) return 0
    return cantidad * precio_m2
  }
  
  // Formatear área para mostrar (con al menos 3 decimales si es menor que 1 m²)
  const formatearArea = (area_m2: number): string => {
    if (area_m2 < 1) {
      // Si es menor que 1 m², mostrar al menos 3 decimales
      return area_m2.toFixed(3)
    }
    // Si es mayor o igual a 1 m², mostrar 2 decimales
    return area_m2.toFixed(2)
  }
  
  // Manejar cambio de variante
  const handleVarianteChange = (nombreVariante: string, valor: string) => {
    setVariantesSeleccionadas(prev => ({
      ...prev,
      [nombreVariante]: valor
    }))
  }
  
  // Obtener nombre de variante para mostrar
  const obtenerNombreVarianteCompleto = (): string => {
    if (!producto || Object.keys(variantesSeleccionadas).length === 0) return ""
    return Object.entries(variantesSeleccionadas)
      .filter(([key]) => !key.toLowerCase().includes('sucursal'))
      .map(([key, value]) => value)
      .join(' - ')
  }
  
  // Manejar cotización
  const handleCotizar = () => {
    const total = calcularTotal()
    if (total <= 0) {
      alert('Por favor, completa todos los campos requeridos')
      return
    }
    
    // Construir URL con parámetros
    const params = new URLSearchParams()
    params.set('producto', producto?.nombre || '')
    params.set('cantidad', cantidad.toString())
    if (ancho > 0) params.set('ancho', ancho.toString())
    if (alto > 0) params.set('alto', alto.toString())
    const nombreVariante = obtenerNombreVarianteCompleto()
    if (nombreVariante) {
      params.set('variante', nombreVariante)
    }
    params.set('precio_unitario', obtenerPrecio().toString())
    params.set('total', total.toString())
    params.set('udm', producto?.unidad_medida || '')
    
    router.push(`/solicitar-cotizacion?${params.toString()}`)
  }
  
  // Loading
  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Error
  if (error || !producto) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <p className="text-muted-foreground mb-4">{error || 'El producto solicitado no existe'}</p>
          <Button asChild>
            <Link href="/impresion-digital">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a productos
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  // Precio por m² del ERP (no se muestra al usuario - solo para cálculo interno)
  const precio_m2 = obtenerPrecio()
  const total = calcularTotal()
  const udm = producto.unidad_medida?.toLowerCase().trim() || ''
  const esM2 = udm === 'm²' || udm === 'm2' || udm === 'metro cuadrado' || udm === 'metros cuadrados'
  
  // Extraer variantes desde variantes_detalle si no vienen en variantes
  const extraerVariantes = (): any[] => {
    if (producto.variantes && Array.isArray(producto.variantes) && producto.variantes.length > 0) {
      // Si vienen desde el ERP, pueden tener formato "Nombre:#hex", mantenerlo
      return producto.variantes.map((v: any) => ({
        nombre: v.nombre,
        valores: v.valores || v.posibilidades || []
      }))
    }
    
    // Extraer desde variantes_detalle - aquí solo tenemos el nombre del valor, no el hex
    // Necesitamos buscar en los recursos originales para obtener los hex codes
    if (producto.variantes_detalle && producto.variantes_detalle.length > 0) {
      const variantesMap = new Map<string, Set<string>>()
      producto.variantes_detalle.forEach((v: any) => {
        if (v.combinacion) {
          const partes = v.combinacion.split('|')
          partes.forEach((parte: string) => {
            const [key, value] = parte.split(':')
            if (key && value && !key.toLowerCase().includes('sucursal')) {
              if (!variantesMap.has(key)) {
                variantesMap.set(key, new Set())
              }
              // Mantener el valor tal cual (puede venir con formato "Nombre:#hex" desde recursos)
              variantesMap.get(key)!.add(value)
            }
          })
        }
      })
      return Array.from(variantesMap.entries()).map(([nombre, valores]) => ({
        nombre,
        valores: Array.from(valores).sort()
      }))
    }
    
    return []
  }
  
  const variantes = extraerVariantes()
  
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/print-shop" className="hover:text-primary">
            Print Shop
          </Link>
          <span className="mx-2">/</span>
          <Link href="/impresion-digital" className="hover:text-primary">
            Impresión Digital
          </Link>
          <span className="mx-2">/</span>
          <span>{producto.nombre}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/impresion-digital">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-muted max-w-sm mx-auto lg:max-w-md">
            {producto.imagen_portada ? (
              <Image
                src={producto.imagen_portada}
                alt={producto.nombre}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <span>Sin imagen</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Detalles y Cotización */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {producto.categoria && (
                <Badge variant="secondary">
                  {producto.categoria}
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
            {producto.descripcion && (
              <p className="text-muted-foreground mb-4">{producto.descripcion}</p>
            )}
          </div>
          
          {/* Información del producto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Ruler className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Unidad de Medida</div>
                  <div className="text-sm text-muted-foreground">{producto.unidad_medida}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Formulario de Presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variantes separadas */}
              {variantes.length > 0 && variantes.map((variante: any) => {
                const nombreVariante = variante.nombre || ''
                const valores = variante.valores || variante.posibilidades || []
                const esColor = nombreVariante.toLowerCase().includes('color') || esVarianteColor(valores)
                const valorSeleccionado = variantesSeleccionadas[nombreVariante] || valores[0] || ''
                
                if (esColor) {
                  // Mostrar círculos de colores
                  return (
                    <div key={nombreVariante} className="space-y-2">
                      <Label>{nombreVariante}</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-wrap gap-3">
                          {valores.map((valor: string) => {
                            // Extraer el nombre del color (sin el código hex si viene en formato "Nombre:#hex")
                            let nombreColor = valor
                            let colorHex = obtenerColorHex(valor)
                            
                            // Si el valor tiene formato "Nombre:#hex", extraer ambos
                            if (valor.includes(':')) {
                              const partes = valor.split(':')
                              if (partes.length === 2 && /^#[0-9A-Fa-f]{6}$/i.test(partes[1].trim())) {
                                nombreColor = partes[0].trim()
                                colorHex = partes[1].trim().toUpperCase()
                              }
                            }
                            
                            const estaSeleccionado = valorSeleccionado === valor
                            // Detectar si es blanco (cualquier variante de blanco)
                            const colorHexUpper = colorHex.toUpperCase()
                            const esBlanco = colorHexUpper === '#FFFFFF' || 
                                            colorHexUpper === '#FFF' || 
                                            colorHexUpper === '#FFFCFC' ||
                                            colorHexUpper === '#FFFCFF' ||
                                            (colorHexUpper.startsWith('#FFF') && colorHexUpper.length === 7)
                            
                            return (
                              <button
                                key={valor}
                                type="button"
                                onClick={() => handleVarianteChange(nombreVariante, valor)}
                                className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                  estaSeleccionado 
                                    ? 'border-primary ring-2 ring-primary ring-offset-1' 
                                    : esBlanco
                                    ? 'border-gray-400 hover:border-primary bg-white'
                                    : 'border-gray-300 hover:border-primary'
                                }`}
                                style={{ 
                                  backgroundColor: esBlanco ? '#FFFFFF' : colorHex,
                                  boxShadow: esBlanco ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                                }}
                                title={nombreColor}
                              >
                                {estaSeleccionado && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Check className={`h-3.5 w-3.5 drop-shadow-lg ${esBlanco ? 'text-gray-700' : 'text-white'}`} />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {valorSeleccionado && (
                          <span className="text-sm font-medium">
                            {valorSeleccionado.includes(':') 
                              ? valorSeleccionado.split(':')[0].trim() 
                              : valorSeleccionado
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  // Mostrar select normal
                  return (
                    <div key={nombreVariante} className="space-y-2">
                      <Label htmlFor={nombreVariante}>{nombreVariante}</Label>
                      <Select 
                        value={valorSeleccionado} 
                        onValueChange={(value) => handleVarianteChange(nombreVariante, value)}
                      >
                        <SelectTrigger id={nombreVariante}>
                          <SelectValue placeholder={`Selecciona ${nombreVariante.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {valores.map((valor: string) => (
                            <SelectItem key={valor} value={valor}>
                              {valor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }
              })}
              
              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="1"
                />
              </div>
              
              {/* Ancho y Alto (solo si es m²) */}
              {esM2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ancho">Ancho (m)</Label>
                      <Input
                        id="ancho"
                        type="number"
                        min="0"
                        step="0.01"
                        value={ancho}
                        onChange={(e) => setAncho(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alto">Alto (m)</Label>
                      <Input
                        id="alto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={alto}
                        onChange={(e) => setAlto(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {ancho > 0 && alto > 0 && cantidad > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Área unitaria: {formatearArea(calcularAreaTotalM2() / cantidad)} m²
                    </div>
                  )}
                </>
              )}
              
              {/* Resumen de precio */}
              <div className="pt-4 border-t space-y-2">
                {esM2 && ancho > 0 && alto > 0 && cantidad > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Área total:</span>
                    <span className="font-medium">
                      {formatearArea(calcularAreaTotalM2())} m²
                    </span>
                  </div>
                )}
                {!esM2 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cantidad:</span>
                    <span className="font-medium">{cantidad}</span>
                  </div>
                )}
                {/* NO mostrar precio por m² - es un cálculo interno del ERP */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB',
                      minimumFractionDigits: 2
                    }).format(total)}
                  </span>
                </div>
              </div>
              
              {/* Botón de presupuesto */}
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleCotizar}
                disabled={total <= 0 || (esM2 && (ancho <= 0 || alto <= 0))}
              >
                <FileText className="mr-2 h-5 w-5" />
                Presupuesto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
