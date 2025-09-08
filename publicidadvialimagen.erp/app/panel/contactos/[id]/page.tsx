"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, Save, Building2, User, Star, Trash2, Edit, Eye } from "lucide-react"
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
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  salesOwnerId?: string
  notes?: string
  favorite: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  salesOwner?: { name: string; email: string }
  tags: Array<{ tag: { name: string; color: string } }>
}

interface SalesOwner {
  id: string
  name: string
  email: string
}

export default function ContactoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [salesOwners, setSalesOwners] = useState<SalesOwner[]>([])
  const [formData, setFormData] = useState({
    kind: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    relation: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "BOTH",
    displayName: "",
    legalName: "",
    taxId: "",
    phone: "",
    email: "",
    website: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    salesOwnerId: "none",
    notes: "",
    favorite: false
  })

  useEffect(() => {
    if (id) {
      fetchContact()
      fetchSalesOwners()
    }
  }, [id])

  const fetchContact = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contactos/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data)
        setFormData({
          kind: data.kind || "COMPANY",
          relation: data.relation || "CUSTOMER",
          displayName: data.displayName || "",
          legalName: data.legalName || "",
          taxId: data.taxId || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          address1: data.address1 || "",
          address2: data.address2 || "",
          city: data.city || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          country: data.country || "",
          salesOwnerId: data.salesOwnerId || "none",
          notes: data.notes || "",
          favorite: data.favorite || false
        })
      } else {
        toast.error("Contacto no encontrado")
        router.push("/panel/contactos")
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

  const handleChange = (field: string, value: string | boolean) => {
    if (field === "salesOwnerId" && value === "none") {
      setFormData(prev => ({ ...prev, [field]: "" }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    if (!formData.displayName) {
      toast.error("El nombre es requerido")
      return
    }

    setSaving(true)
    
    try {
      const submitData = {
        ...formData,
        salesOwnerId: formData.salesOwnerId === "none" ? null : formData.salesOwnerId
      }
      
      const response = await fetch(`/api/contactos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const updated = await response.json()
        setContact(updated)
        setEditing(false)
        toast.success("Contacto actualizado correctamente")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar el contacto")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/contactos/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Contacto eliminado correctamente")
        router.push("/panel/contactos")
      } else {
        toast.error("Error al eliminar el contacto")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Contacto no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel/contactos" className="text-gray-600 hover:text-gray-800 mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Contactos
            </Link>
            <div className="text-xl font-bold text-slate-800">
              {editing ? "Editando Contacto" : contact.displayName}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {editing ? "Editar Contacto" : contact.displayName}
            </h1>
            <p className="text-gray-600">
              {editing ? "Modifica la información del contacto" : "Detalles del contacto"}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el contacto "{contact.displayName}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      kind: contact.kind || "COMPANY",
                      relation: contact.relation || "CUSTOMER",
                      displayName: contact.displayName || "",
                      legalName: contact.legalName || "",
                      taxId: contact.taxId || "",
                      phone: contact.phone || "",
                      email: contact.email || "",
                      website: contact.website || "",
                      address1: contact.address1 || "",
                      address2: contact.address2 || "",
                      city: contact.city || "",
                      state: contact.state || "",
                      postalCode: contact.postalCode || "",
                      country: contact.country || "",
                      salesOwnerId: contact.salesOwnerId || "",
                      notes: contact.notes || "",
                      favorite: contact.favorite || false
                    })
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-[#D54644] hover:bg-[#B03A38]"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información Principal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Principal</CardTitle>
              <CardDescription>Datos básicos del contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="kind-company"
                        name="kind"
                        value="COMPANY"
                        checked={formData.kind === "COMPANY"}
                        onChange={(e) => handleChange("kind", e.target.value)}
                        className="w-4 h-4 text-[#D54644]"
                      />
                      <Label htmlFor="kind-company" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Compañía
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="kind-individual"
                        name="kind"
                        value="INDIVIDUAL"
                        checked={formData.kind === "INDIVIDUAL"}
                        onChange={(e) => handleChange("kind", e.target.value)}
                        className="w-4 h-4 text-[#D54644]"
                      />
                      <Label htmlFor="kind-individual" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Individual
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="displayName" className="text-lg font-medium">
                      Nombre del Contacto *
                    </Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleChange("displayName", e.target.value)}
                      className="text-lg mt-2"
                      required
                    />
                  </div>

                  {formData.kind === "COMPANY" && (
                    <div>
                      <Label htmlFor="legalName">Razón Social</Label>
                      <Input
                        id="legalName"
                        value={formData.legalName}
                        onChange={(e) => handleChange("legalName", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxId">NIT</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => handleChange("taxId", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="relation">Relación *</Label>
                      <Select value={formData.relation} onValueChange={(value) => handleChange("relation", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Cliente</SelectItem>
                          <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                          <SelectItem value="BOTH">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {contact.kind === "COMPANY" ? (
                        <Building2 className="w-6 h-6 text-gray-500" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {contact.kind === "COMPANY" ? "Compañía" : "Individual"}
                      </span>
                    </div>
                    <Badge className={getRelationColor(contact.relation)}>
                      {getRelationLabel(contact.relation)}
                    </Badge>
                    {contact.favorite && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Favorito
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nombre</Label>
                    <p className="text-lg font-medium">{contact.displayName}</p>
                    {contact.legalName && (
                      <p className="text-sm text-gray-500 mt-1">{contact.legalName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">NIT</Label>
                      <p className="font-mono">{contact.taxId || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Relación</Label>
                      <Badge className={getRelationColor(contact.relation)}>
                        {getRelationLabel(contact.relation)}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Datos para comunicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salesOwnerId">Comercial Asignado</Label>
                    <Select value={formData.salesOwnerId} onValueChange={(value) => handleChange("salesOwnerId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar comercial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {salesOwners.map(owner => (
                          <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                    <p>{contact.phone || "N/A"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Correo Electrónico</Label>
                    <p>{contact.email || "N/A"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Sitio Web</Label>
                    <p>{contact.website || "N/A"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Comercial Asignado</Label>
                    <p>{contact.salesOwner?.name || "Sin asignar"}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dirección */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>Información de ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address1">Dirección 1</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e) => handleChange("address1", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address2">Dirección 2</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e) => handleChange("address2", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">Estado/Provincia</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleChange("postalCode", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Dirección 1</Label>
                  <p>{contact.address1 || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Dirección 2</Label>
                  <p>{contact.address2 || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ciudad</Label>
                  <p>{contact.city || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado/Provincia</Label>
                  <p>{contact.state || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Código Postal</Label>
                  <p>{contact.postalCode || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">País</Label>
                  <p>{contact.country || "N/A"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
            <CardDescription>Información adicional sobre el contacto</CardDescription>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                placeholder="Escribe notas adicionales sobre este contacto..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
              />
            ) : (
              <p>{contact.notes || "Sin notas"}</p>
            )}
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium text-gray-700">Creado</Label>
                <p>{formatDate(contact.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Última actualización</Label>
                <p>{formatDate(contact.updatedAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Estado</Label>
                <Badge variant={contact.isActive ? "default" : "secondary"}>
                  {contact.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
