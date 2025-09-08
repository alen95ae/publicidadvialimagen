"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Search, Filter, Download, Star, Building2, User, MoreHorizontal, Eye, Edit, Trash2, Star as StarIcon } from "lucide-react"
import { toast } from "sonner"

interface Contact {
  id: string
  kind: "INDIVIDUAL" | "COMPANY"
  relation: "CUSTOMER" | "SUPPLIER" | "BOTH"
  displayName: string
  legalName?: string
  taxId?: string
  phone?: string
  email?: string
  website?: string
  city?: string
  country?: string
  favorite: boolean
  salesOwner?: { name: string; email: string }
  tags: Array<{ tag: { name: string; color: string } }>
}

interface ContactFilters {
  q: string
  relation: string
  city: string
  country: string
  owner: string
  favorite: boolean
}

export default function ContactosPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<ContactFilters>({
    q: "",
    relation: "ALL",
    city: "",
    country: "",
    owner: "ALL",
    favorite: false
  })
  const [groupBy, setGroupBy] = useState<string>("NONE")
  const [salesOwners, setSalesOwners] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchContacts()
    fetchSalesOwners()
  }, [filters])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.q) params.append("q", filters.q)
      if (filters.relation && filters.relation !== "ALL") params.append("relation", filters.relation)
      if (filters.city) params.append("city", filters.city)
      if (filters.country) params.append("country", filters.country)
      if (filters.owner && filters.owner !== "ALL") params.append("owner", filters.owner)
      if (filters.favorite) params.append("favorite", "true")

      const response = await fetch(`/api/contactos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.items)
      } else {
        toast.error("Error al cargar los contactos")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesOwners = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const users = await response.json()
        setSalesOwners(users.filter((user: any) => user.role !== "ADMIN"))
      }
    } catch (error) {
      console.error("Error fetching sales owners:", error)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.q) params.append("q", filters.q)
      if (filters.relation && filters.relation !== "ALL") params.append("relation", filters.relation)
      if (filters.city) params.append("city", filters.city)
      if (filters.country) params.append("country", filters.country)
      if (filters.owner && filters.owner !== "ALL") params.append("owner", filters.owner)
      if (filters.favorite) params.append("favorite", "true")

      const response = await fetch(`/api/contactos/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contactos_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Exportación completada")
      } else {
        toast.error("Error al exportar")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleToggleFavorite = async (contactId: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/contactos/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !currentFavorite })
      })

      if (response.ok) {
        setContacts(prev => prev.map(contact => 
          contact.id === contactId 
            ? { ...contact, favorite: !currentFavorite }
            : contact
        ))
        toast.success(currentFavorite ? "Removido de favoritos" : "Añadido a favoritos")
      } else {
        toast.error("Error al actualizar favorito")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedContacts.size === 0) return

    try {
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contactos/${id}`, { method: "DELETE" })
      )

      await Promise.all(promises)
      setSelectedContacts(new Set())
      fetchContacts()
      toast.success(`${selectedContacts.size} contacto(s) eliminado(s)`)
    } catch (error) {
      toast.error("Error al eliminar contactos")
    }
  }

  const handleBulkRelationChange = async (relation: string) => {
    if (selectedContacts.size === 0) return

    try {
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contactos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ relation })
        })
      )

      await Promise.all(promises)
      setSelectedContacts(new Set())
      fetchContacts()
      toast.success(`Relación actualizada para ${selectedContacts.size} contacto(s)`)
    } catch (error) {
      toast.error("Error al actualizar relaciones")
    }
  }

  const groupedContacts = useMemo(() => {
    if (!groupBy || groupBy === "NONE") return [{ key: "Todos", contacts, count: contacts.length }]

    const groups: { [key: string]: Contact[] } = {}
    contacts.forEach(contact => {
      let key = ""
      switch (groupBy) {
        case "owner":
          key = contact.salesOwner?.name || "Sin asignar"
          break
        case "city":
          key = contact.city || "Sin ciudad"
          break
        case "country":
          key = contact.country || "Sin país"
          break
        default:
          key = "Sin agrupar"
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(contact)
    })

    return Object.entries(groups).map(([key, contacts]) => ({
      key,
      contacts,
      count: contacts.length
    }))
  }, [contacts, groupBy])

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case "CUSTOMER": return "Cliente"
      case "SUPPLIER": return "Proveedor"
      case "BOTH": return "Ambos"
      default: return relation
    }
  }

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case "CUSTOMER": return "bg-blue-100 text-blue-800"
      case "SUPPLIER": return "bg-green-100 text-green-800"
      case "BOTH": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel" className="text-gray-600 hover:text-gray-800 mr-4">
              ← Panel
            </Link>
            <div className="text-xl font-bold text-slate-800">Contactos</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Contactos</h1>
          <p className="text-gray-600">Administra tu base de datos de contactos comerciales</p>
        </div>

        {/* Barra superior sticky */}
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Botones principales */}
            <div className="flex gap-2">
              <Link href="/panel/contactos/nuevo">
                <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </Link>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Buscar contactos..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                              <Select value={filters.relation} onValueChange={(value) => setFilters(prev => ({ ...prev, relation: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Relación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                    <SelectItem value="BOTH">Ambos</SelectItem>
                  </SelectContent>
                </Select>

              <Select value={filters.owner} onValueChange={(value) => setFilters(prev => ({ ...prev, owner: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Comercial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {salesOwners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Toggle
                pressed={filters.favorite}
                onPressedChange={(pressed) => setFilters(prev => ({ ...prev, favorite: pressed }))}
                className="data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-800"
              >
                <Star className="w-4 h-4" />
              </Toggle>
            </div>
          </div>

          {/* Agrupar por */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Agrupar por:</span>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sin agrupar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin agrupar</SelectItem>
                <SelectItem value="owner">Comercial</SelectItem>
                <SelectItem value="city">Ciudad</SelectItem>
                <SelectItem value="country">País</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Acciones masivas */}
          {selectedContacts.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedContacts.size} contacto(s) seleccionado(s)
                </span>
                <div className="flex gap-2">
                  <Select onValueChange={handleBulkRelationChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Cambiar relación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Cliente</SelectItem>
                      <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                      <SelectItem value="BOTH">Ambos</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar contactos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará {selectedContacts.size} contacto(s) seleccionado(s).
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de contactos */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {filters.q || filters.relation || filters.owner ? (
                    "No se encontraron contactos con los filtros aplicados"
                  ) : (
                    "No hay contactos registrados"
                  )}
                </div>
                <Link href="/panel/contactos/nuevo">
                  <Button className="bg-[#D54644] hover:bg-[#B03A38]">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer contacto
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.size === contacts.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts(new Set(contacts.map(c => c.id)))
                          } else {
                            setSelectedContacts(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Comercial</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="w-12">Favorito</TableHead>
                    <TableHead className="w-12">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedContacts.map((group) => (
                    groupBy && groupBy !== "NONE" ? (
                      // Grupo con header
                      <TableRow key={group.key} className="bg-gray-50">
                        <TableCell colSpan={10} className="font-medium text-gray-700">
                          {group.key} ({group.count})
                        </TableCell>
                      </TableRow>
                    ) : null,
                    group.contacts?.map((contact) => (
                      <TableRow key={contact.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.has(contact.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedContacts)
                              if (checked) {
                                newSelected.add(contact.id)
                              } else {
                                newSelected.delete(contact.id)
                              }
                              setSelectedContacts(newSelected)
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {contact.kind === "COMPANY" ? (
                              <Building2 className="w-4 h-4 text-gray-500" />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                            <div>
                              <div className="font-medium">{contact.displayName}</div>
                              {contact.legalName && (
                                <div className="text-sm text-gray-500">{contact.legalName}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {contact.taxId || "-"}
                        </TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>
                          {contact.salesOwner?.name || "-"}
                        </TableCell>
                        <TableCell>{contact.city || "-"}</TableCell>
                        <TableCell>{contact.country || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(contact.id, contact.favorite)}
                            className={contact.favorite ? "text-yellow-500" : "text-gray-400"}
                          >
                            <StarIcon className="w-4 h-4" fill={contact.favorite ? "currentColor" : "none"} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/panel/contactos/${contact.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/panel/contactos/${contact.id}`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleToggleFavorite(contact.id, contact.favorite)}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                {contact.favorite ? "Quitar favorito" : "Marcar favorito"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
