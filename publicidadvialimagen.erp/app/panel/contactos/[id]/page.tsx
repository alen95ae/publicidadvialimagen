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
import { ArrowLeft, Save, Building2, User, Home } from "lucide-react"
import { toast } from "sonner"
import Sidebar from "@/components/sidebar"

interface SalesOwner {
  id: string
  name: string
  email: string
}

export default function EditarContactoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salesOwners, setSalesOwners] = useState<SalesOwner[]>([])
  const [formData, setFormData] = useState({
    kind: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    relation: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "BOTH",
    displayName: "",
    legalName: "",
    company: "",
    taxId: "",
    phone: "",
    email: "",
    website: "",
    address1: "",
    city: "",
    country: "",
    salesOwnerId: "none",
    notes: "",
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
        setFormData({
          kind: data.kind || "COMPANY",
          relation: data.relation || "CUSTOMER",
          displayName: data.displayName || "",
          legalName: data.legalName || "",
          company: data.company || "",
          taxId: data.taxId || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          address1: data.address || "",
          city: data.city || "",
          country: data.country || "",
          salesOwnerId: data.salesOwnerId || "none",
          notes: data.notes || "",
        })
      } else {
        toast.error("Contacto no encontrado")
        router.push("/panel/contactos")
      }
    } catch (error) {
      toast.error("Error al cargar el contacto")
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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        toast.success("Contacto actualizado correctamente")
        router.push("/panel/contactos")
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

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">Cargando...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/panel" 
                className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
                title="Ir al panel principal"
              >
                <Home className="w-5 h-5" />
              </Link>
              <div className="text-xl font-bold text-slate-800">Contactos</div>
              <div className="flex items-center gap-6 ml-4">
                <Link 
                  href="/panel/contactos" 
                  className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
                >
                  Contactos
                </Link>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Editar Contacto</h1>
          <p className="text-gray-600">Modifica la información del contacto</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tipo de contacto */}
                <div className="flex gap-4 mb-4">
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
                    <Label htmlFor="kind-company" className="flex items-center gap-2 cursor-pointer">
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
                    <Label htmlFor="kind-individual" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Individual
                    </Label>
                  </div>
                </div>

                {/* Nombre del contacto */}
                <div>
                  <Label htmlFor="displayName">Nombre del Contacto *</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleChange("displayName", e.target.value)}
                    placeholder={formData.kind === "COMPANY" ? "Nombre de la empresa" : "Nombre completo"}
                    required
                  />
                </div>

                {/* Empresa - solo para empresas */}
                {formData.kind === "COMPANY" && (
                  <div>
                    <Label htmlFor="legalName">Empresa</Label>
                    <Input
                      id="legalName"
                      value={formData.legalName}
                      onChange={(e) => handleChange("legalName", e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                )}

                {/* Empresa */}
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                {/* NIT y Relación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxId">NIT</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleChange("taxId", e.target.value)}
                      placeholder="Número de identificación tributaria"
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
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos para comunicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+591 2 123456"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://www.empresa.com"
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
              </CardContent>
            </Card>

            {/* Dirección */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección</CardTitle>
                <CardDescription>Información de ubicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address1">Dirección</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => handleChange("address1", e.target.value)}
                    placeholder="Calle y número"
                  />
                </div>
                
                
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="País"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>Información adicional sobre el contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Escribe notas adicionales sobre este contacto..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex gap-4 justify-end">
            <Link href="/panel/contactos">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-[#D54644] hover:bg-[#B03A38]"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
        </main>
      </div>
    </Sidebar>
  )
}
