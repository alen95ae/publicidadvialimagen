/**
 * Funciones UI compartidas para cotizaciones
 * 
 * E5: Centraliza funciones duplicadas entre nuevo/page.tsx y editar/[id]/page.tsx
 */

import { ItemLista, ProductoItem, NotaItem, SeccionItem } from '@/hooks/useCotizacionData'

/**
 * Agregar un nuevo producto a la lista
 */
export function agregarProductoToList(
  productosList: ItemLista[],
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void,
  setTotalManual?: (value: number | null) => void
): void {
  const nuevoProducto: ProductoItem = {
    id: Date.now().toString(),
    tipo: 'producto',
    producto: "",
    descripcion: "",
    cantidad: 1,
    ancho: 0,
    alto: 0,
    totalM2: 0,
    udm: "m²",
    precio: 0,
    comision: 0,
    conIVA: true,
    conIT: true,
    total: 0,
    esSoporte: false,
    dimensionesBloqueadas: false
  }
  setProductosList(prev => [...prev, nuevoProducto])
  if (setTotalManual) {
    setTotalManual(null)
  }
}

/**
 * Agregar una nueva nota a la lista
 */
export function agregarNotaToList(
  productosList: ItemLista[],
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  const nuevaNota: NotaItem = {
    id: Date.now().toString(),
    tipo: 'nota',
    texto: ""
  }
  setProductosList(prev => [...prev, nuevaNota])
}

/**
 * Agregar una nueva sección a la lista
 */
export function agregarSeccionToList(
  productosList: ItemLista[],
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  const nuevaSeccion: SeccionItem = {
    id: Date.now().toString(),
    tipo: 'seccion',
    texto: ""
  }
  setProductosList(prev => [...prev, nuevaSeccion])
}

/**
 * Eliminar un producto de la lista
 */
export function eliminarProductoFromList(
  productosList: ItemLista[],
  id: string,
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  if (productosList.length > 1) {
    setProductosList(prev => prev.filter(p => p.id !== id))
  }
}

/**
 * Actualizar el texto de una nota
 */
export function actualizarNotaInList(
  productosList: ItemLista[],
  id: string,
  texto: string,
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  setProductosList(prev => prev.map(item => {
    if (item.id === id && item.tipo === 'nota') {
      return { ...item, texto }
    }
    return item
  }))
}

/**
 * Actualizar el texto de una sección
 */
export function actualizarSeccionInList(
  productosList: ItemLista[],
  id: string,
  texto: string,
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  setProductosList(prev => prev.map(item => {
    if (item.id === id && item.tipo === 'seccion') {
      return { ...item, texto }
    }
    return item
  }))
}

/**
 * Mover un item en la lista
 */
export function moverItemInList(
  productosList: ItemLista[],
  index: number,
  direccion: 'arriba' | 'abajo',
  setProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
): void {
  const newIndex = direccion === 'arriba' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= productosList.length) return

  setProductosList(prev => {
    const newList = [...prev]
    const [movedItem] = newList.splice(index, 1)
    newList.splice(newIndex, 0, movedItem)
    return newList
  })
}

/**
 * Filtrar items (productos/soportes) por código o nombre
 */
export function filtrarItems(
  todosLosItems: any[],
  searchValue: string,
  setFilteredItems: (updater: (prev: Record<string, any[]>) => Record<string, any[]>) => void,
  productoId: string
): void {
  if (!searchValue || searchValue.trim() === '') {
    setFilteredItems(prev => ({ ...prev, [productoId]: todosLosItems.slice(0, 20) }))
    return
  }

  const search = searchValue.toLowerCase().trim()

  const filtered = todosLosItems.filter((item: any) => {
    const codigo = (item.codigo || '').toLowerCase()
    const nombre = (item.nombre || '').toLowerCase()

    // Buscar solo al inicio del código o del nombre
    return codigo.startsWith(search) || nombre.startsWith(search)
  }).slice(0, 15) // Limitar a 15 resultados máximo

  setFilteredItems(prev => ({ ...prev, [productoId]: filtered }))
}

/**
 * Filtrar clientes por nombre o empresa
 */
export function filtrarClientes(
  todosLosClientes: any[],
  query: string,
  setFilteredClientes: (clientes: any[]) => void
): void {
  if (!query || query.trim() === '') {
    setFilteredClientes(todosLosClientes.slice(0, 50))
    return
  }

  const search = query.toLowerCase().trim()
  const filtered = todosLosClientes.filter((cliente: any) => {
    const nombre = (cliente.displayName || '').toLowerCase()
    const empresa = (cliente.legalName || '').toLowerCase()

    // Buscar en cualquier parte del nombre o empresa (no solo al inicio)
    return nombre.includes(search) || empresa.includes(search)
  }).slice(0, 100) // Limitar a 100 resultados coincidentes

  setFilteredClientes(filtered)
}

/**
 * Filtrar comerciales por nombre
 */
export function filtrarComerciales(
  todosLosComerciales: any[],
  query: string,
  setFilteredComerciales: (comerciales: any[]) => void
): void {
  if (!query || query.trim() === '') {
    setFilteredComerciales(todosLosComerciales.slice(0, 20))
    return
  }

  const search = query.toLowerCase().trim()
  const filtered = todosLosComerciales.filter((comercial: any) => {
    const nombre = (comercial.nombre || '').toLowerCase()

    // Buscar al inicio del nombre
    return nombre.startsWith(search)
  }).slice(0, 15) // Limitar a 15 resultados máximo

  setFilteredComerciales(filtered)
}






