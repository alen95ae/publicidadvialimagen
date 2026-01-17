"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeft, Save, Building2, User, Check, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SalesOwner {
  id: string
  name: string
  email: string
}

export default function NuevoContactoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salesOwners, setSalesOwners] = useState<SalesOwner[]>([])
  const [formData, setFormData] = useState({
    kind: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    relation: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "BOTH",
    displayName: "",
    company: "",
    companyId: "", // ID del contacto empresa (para Individual)
    razonSocial: "",
    personaContacto: [] as Array<{ id: string; nombre: string }>, // Array de personas de contacto (para Compañía)
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

  // Estados para autocompletar de empresa (Individual)
  const [openEmpresaCombobox, setOpenEmpresaCombobox] = useState(false)
  const [todosLosContactos, setTodosLosContactos] = useState<any[]>([])
  const [filteredEmpresas, setFilteredEmpresas] = useState<any[]>([])
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false)

  // Estados para autocompletar de persona de contacto (Compañía)
  const [openPersonaContactoCombobox, setOpenPersonaContactoCombobox] = useState(false)
  const [filteredPersonasContacto, setFilteredPersonasContacto] = useState<any[]>([])
  const [personaContactoInputValue, setPersonaContactoInputValue] = useState("")

  useEffect(() => {
    fetchSalesOwners()
    fetchContactos()
  }, [])

  // Cargar todos los contactos para autocompletar
  const fetchContactos = async () => {
    setCargandoEmpresas(true)
    try {
      const response = await fetch('/api/contactos')
      if (response.ok) {
        const data = await response.json()
        const contactos = data.data || []
        setTodosLosContactos(contactos)
        // Filtrar solo compañías para el autocompletar de empresa
        const empresas = contactos.filter((c: any) => c.kind === 'COMPANY')
        setFilteredEmpresas(empresas.slice(0, 50))
        // Para personas de contacto, usar todos los contactos (individuales y compañías)
        setFilteredPersonasContacto(contactos.slice(0, 50))
      }
    } catch (error) {
      console.error('Error cargando contactos:', error)
    } finally {
      setCargandoEmpresas(false)
    }
  }

  // Filtrar empresas (solo compañías)
  const filtrarEmpresas = (query: string) => {
    if (!query || query.trim() === '') {
      const empresas = todosLosContactos.filter((c: any) => c.kind === 'COMPANY')
      setFilteredEmpresas(empresas.slice(0, 50))
      return
    }

    const search = query.toLowerCase().trim()
    const empresas = todosLosContactos.filter((c: any) => {
      if (c.kind !== 'COMPANY') return false
      const nombre = (c.displayName || '').toLowerCase()
      const empresa = (c.legalName || c.company || '').toLowerCase()
      return nombre.includes(search) || empresa.includes(search)
    }).slice(0, 100)

    setFilteredEmpresas(empresas)
  }

  // Filtrar personas de contacto (todos los contactos)
  const filtrarPersonasContacto = (query: string) => {
    if (!query || query.trim() === '') {
      setFilteredPersonasContacto(todosLosContactos.slice(0, 50))
      return
    }

    const search = query.toLowerCase().trim()
    const filtered = todosLosContactos.filter((c: any) => {
      const nombre = (c.displayName || '').toLowerCase()
      const empresa = (c.legalName || c.company || '').toLowerCase()
      return nombre.includes(search) || empresa.includes(search)
    }).slice(0, 100)

    setFilteredPersonasContacto(filtered)
  }

  // Agregar persona de contacto
  const agregarPersonaContacto = (contacto: any) => {
    const yaExiste = formData.personaContacto.some(p => p.id === contacto.id)
    if (!yaExiste) {
      setFormData(prev => ({
        ...prev,
        personaContacto: [...prev.personaContacto, { id: contacto.id, nombre: contacto.displayName }]
      }))
    }
    setPersonaContactoInputValue("")
    setOpenPersonaContactoCombobox(false)
  }

  // Remover persona de contacto
  const removerPersonaContacto = (id: string) => {
    setFormData(prev => ({
      ...prev,
      personaContacto: prev.personaContacto.filter(p => p.id !== id)
    }))
  }

  const fetchSalesOwners = async () => {
    try {
      const response = await fetch("/api/public/comerciales")
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        // El endpoint ya filtra solo vendedores, no necesitamos filtrar de nuevo
        setSalesOwners(users.map((user: any) => ({
          id: user.id,
          name: user.nombre || user.name || "",
          email: user.email || ""
        })))
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

    setLoading(true)
    
    try {
      const submitData = {
        ...formData,
        salesOwnerId: formData.salesOwnerId === "none" ? null : formData.salesOwnerId,
        // Para Individual: enviar companyId, para Compañía: enviar personaContacto como JSON
        ...(formData.kind === "INDIVIDUAL" 
          ? { companyId: formData.companyId || null }
          : { personaContacto: formData.personaContacto.length > 0 ? formData.personaContacto : null }
        )
      }
      
      const response = await fetch("/api/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast.success("Contacto creado correctamente")
        router.push("/panel/contactos")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear el contacto")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="min-h-screen bg-gray-50">

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Crear Nuevo Contacto</h1>
              <p className="text-gray-600">Añade un nuevo contacto a tu base de datos</p>
            </div>
            {/* Acciones */}
            <div className="flex gap-4">
              <Link href="/panel/contactos">
                <Button variant="outline">Descartar</Button>
              </Link>
              <Button 
                type="submit" 
                form="contacto-form"
                className="bg-[#D54644] hover:bg-[#B03A38]"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault()
                  const form = document.getElementById('contacto-form') as HTMLFormElement
                  if (form) form.requestSubmit()
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creando..." : "Crear Contacto"}
              </Button>
            </div>
          </div>
        </div>

        <form id="contacto-form" onSubmit={handleSubmit}>
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

                {/* Empresa (Individual) o Persona de Contacto (Compañía) */}
                {formData.kind === "INDIVIDUAL" ? (
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Popover open={openEmpresaCombobox} onOpenChange={setOpenEmpresaCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !formData.companyId && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {formData.companyId
                              ? todosLosContactos.find(c => c.id === formData.companyId && c.kind === 'COMPANY')?.displayName || "Seleccionar empresa"
                              : "Seleccionar empresa"}
                          </span>
                          <Check className={cn("ml-2 h-4 w-4 shrink-0", formData.companyId ? "opacity-100" : "opacity-0")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false} className="overflow-visible">
                          <CommandInput
                            placeholder="Buscar empresa..."
                            className="h-9 border-0 focus:ring-0"
                            onValueChange={filtrarEmpresas}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {cargandoEmpresas ? "Cargando..." : "No se encontraron empresas."}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredEmpresas.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={c.displayName}
                                  onSelect={async () => {
                                    // Cargar datos completos de la empresa
                                    try {
                                      const empresaRes = await fetch(`/api/contactos/${c.id}`)
                                      if (empresaRes.ok) {
                                        const empresaData = await empresaRes.json()
                                        console.log('📋 Datos RAW de empresa:', JSON.stringify(empresaData, null, 2))
                                        
                                        // Importar datos de la empresa al nuevo contacto
                                        setFormData(prev => {
                                          const nuevosDatos = {
                                            ...prev,
                                            companyId: c.id,
                                            company: c.displayName,
                                            // Importar razón social: solo si el campo actual está vacío
                                            razonSocial: prev.razonSocial?.trim() 
                                              ? prev.razonSocial 
                                              : (empresaData.razonSocial || empresaData.razon_social || ""),
                                            // Importar NIT: mapear nit → taxId
                                            taxId: prev.taxId?.trim() 
                                              ? prev.taxId 
                                              : (empresaData.taxId || empresaData.nit || ""),
                                            // Importar sitio web: mapear sitio_web → website
                                            website: prev.website?.trim() 
                                              ? prev.website 
                                              : (empresaData.website || empresaData.sitio_web || ""),
                                            // Importar dirección: mapear address/direccion → address1
                                            address1: prev.address1?.trim() 
                                              ? prev.address1 
                                              : (empresaData.address || empresaData.address1 || empresaData.direccion || ""),
                                            // Importar ciudad: mapear ciudad → city
                                            city: prev.city?.trim() 
                                              ? prev.city 
                                              : (empresaData.city || empresaData.ciudad || "")
                                          }
                                          console.log('✅ Datos importados al formulario:', {
                                            razonSocial: nuevosDatos.razonSocial,
                                            taxId: nuevosDatos.taxId,
                                            website: nuevosDatos.website,
                                            address1: nuevosDatos.address1,
                                            city: nuevosDatos.city
                                          })
                                          return nuevosDatos
                                        })
                                      } else {
                                        console.error('❌ Error cargando empresa:', empresaRes.status)
                                        // Si no se puede cargar, al menos guardar el ID y nombre
                                        setFormData(prev => ({
                                          ...prev,
                                          companyId: c.id,
                                          company: c.displayName
                                        }))
                                      }
                                    } catch (error) {
                                      console.error('❌ Error cargando datos de empresa:', error)
                                      // En caso de error, al menos guardar el ID y nombre
                                      setFormData(prev => ({
                                        ...prev,
                                        companyId: c.id,
                                        company: c.displayName
                                      }))
                                    }
                                    setOpenEmpresaCombobox(false)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", formData.companyId === c.id ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{c.displayName}</span>
                                    {c.legalName && <span className="text-xs text-gray-500">{c.legalName}</span>}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div>
                    <Label>Persona de Contacto</Label>
                    <Popover open={openPersonaContactoCombobox} onOpenChange={setOpenPersonaContactoCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          <span className="text-muted-foreground">Buscar y agregar persona de contacto...</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false} className="overflow-visible">
                          <CommandInput
                            placeholder="Buscar contacto..."
                            className="h-9 border-0 focus:ring-0"
                            value={personaContactoInputValue}
                            onValueChange={(value) => {
                              setPersonaContactoInputValue(value)
                              filtrarPersonasContacto(value)
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {cargandoEmpresas ? "Cargando..." : "No se encontraron contactos."}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredPersonasContacto.map((c) => {
                                const yaExiste = formData.personaContacto.some(p => p.id === c.id)
                                return (
                                  <CommandItem
                                    key={c.id}
                                    value={c.displayName}
                                    onSelect={() => agregarPersonaContacto(c)}
                                    className={cn("cursor-pointer", yaExiste && "opacity-50")}
                                    disabled={yaExiste}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", yaExiste ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{c.displayName}</span>
                                      {c.legalName && <span className="text-xs text-gray-500">{c.legalName}</span>}
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Chips de personas de contacto seleccionadas */}
                    {formData.personaContacto && formData.personaContacto.length > 0 && (
                      <div className="min-h-[60px] w-full rounded-md border border-gray-200 bg-white p-3 mt-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.personaContacto.map((persona) => (
                            <div
                              key={persona.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-800"
                            >
                              <span>{persona.nombre}</span>
                              <button
                                type="button"
                                onClick={() => removerPersonaContacto(persona.id)}
                                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Razón Social */}
                <div>
                  <Label htmlFor="razonSocial">Razón Social</Label>
                  <Input
                    id="razonSocial"
                    value={formData.razonSocial}
                    onChange={(e) => handleChange("razonSocial", e.target.value)}
                    placeholder="Razón social"
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
                    <Select 
                      value={formData.relation || "CUSTOMER"} 
                      onValueChange={(value) => {
                        console.log('🔄 Cambiando relación a:', value)
                        handleChange("relation", value)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar relación" />
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
        </form>
        </main>
      </div>
    </div>
  )
}
