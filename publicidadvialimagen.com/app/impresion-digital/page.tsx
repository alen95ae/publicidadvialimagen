"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FileText, X, Loader2, Search, Ruler } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  mostrar_en_web: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export default function ImpresionDigitalPage() {
  const { t } = useTranslations()
  const searchParams = useSearchParams()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)

  // Obtener categoría de la URL
  useEffect(() => {
    const categoria = searchParams.get('categoria')
    if (categoria) {
      setCategoriaFiltro(categoria)
    }
  }, [searchParams])

  // Cargar productos desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/productos', {
          cache: 'no-store',
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar productos')
        }
        
        setProductos(data.data || [])
      } catch (err) {
        console.error('Error cargando productos:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar productos')
      } finally {
        setLoading(false)
      }
    }
    
    cargarProductos()
  }, [])

  // Filtrar productos por búsqueda y categoría
  const productosFiltrados = productos.filter((producto) => {
    // Filtro por categoría desde URL
    if (categoriaFiltro && producto.categoria !== categoriaFiltro) {
      return false
    }
    
    // Filtro por búsqueda
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    return (
      producto.nombre.toLowerCase().includes(query) ||
      producto.codigo.toLowerCase().includes(query) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(query)) ||
      (producto.categoria && producto.categoria.toLowerCase().includes(query))
    )
  })

  return (
    <main className="flex-1">
      {/* Productos Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="mb-8">
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary">
                {t('nav.home')}
              </Link>
              <span className="mx-2">/</span>
              <Link href="/print-shop" className="hover:text-primary">
                PrintShop
              </Link>
              <span className="mx-2">/</span>
              <span>Impresión Digital</span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Nuestros Productos
            </h2>
            <p className="text-muted-foreground md:text-lg text-pretty">
              Descubre nuestra gama completa de materiales de impresión digital profesional
            </p>
          </div>

          {/* Búsqueda y Filtros Activos */}
          <div className="mb-6 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre, código o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Filtros activos */}
            {(categoriaFiltro || searchQuery) && (
              <div className="flex flex-wrap gap-2 items-center">
                {categoriaFiltro && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Categoría: {categoriaFiltro}
                    <Link href="/impresion-digital">
                      <X className="h-3 w-3 cursor-pointer hover:text-primary" />
                    </Link>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Búsqueda: {searchQuery}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-primary" 
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando productos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error al cargar los productos</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Productos Grid */}
          {!loading && !error && (
            <>
              {productosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery || categoriaFiltro ? 'No se encontraron productos' : 'No hay productos disponibles'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || categoriaFiltro
                      ? 'Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.'
                      : 'Próximamente estaremos agregando más productos a nuestro catálogo.'}
                  </p>
                  {(searchQuery || categoriaFiltro) && (
                    <Button onClick={() => { setSearchQuery(""); setCategoriaFiltro(null); }} variant="outline">
                      Limpiar búsqueda y filtros
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Mostrando {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {productosFiltrados.map((producto) => (
                      <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <Link href={`/impresion-digital/${producto.id}`} className="w-full aspect-square relative block">
                          {producto.imagen_portada ? (
                            <Image
                              src={producto.imagen_portada}
                              alt={producto.nombre}
                              width={300}
                              height={300}
                              className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 25vw, 20vw"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                              <span className="text-xs">Sin imagen</span>
                            </div>
                          )}
                        </Link>
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-semibold text-sm text-balance flex-1 line-clamp-2 leading-tight">
                                {producto.nombre}
                              </h3>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t">
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                {producto.categoria && (
                                  <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
                                    {producto.categoria}
                                  </Badge>
                                )}
                                {producto.precio_venta > 0 && (
                                  <span className="text-xs font-medium text-primary leading-tight">
                                    {new Intl.NumberFormat('es-BO', {
                                      style: 'currency',
                                      currency: 'BOB',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(producto.precio_venta)}
                                    {producto.unidad_medida && (
                                      <span className="text-[10px] text-muted-foreground"> / {producto.unidad_medida}</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-xs shrink-0 h-7 px-2"
                                asChild
                              >
                                <Link href={`/impresion-digital/${producto.id}`}>
                                  <Ruler className="mr-1 h-3 w-3" />
                                  Calcular
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
