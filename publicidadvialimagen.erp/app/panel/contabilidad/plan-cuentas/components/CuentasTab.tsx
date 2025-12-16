"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import type { Cuenta, CuentaSaldos, TipoCuenta, TipoAuxiliar, Moneda } from "@/lib/types/contabilidad"
import { api } from "@/lib/fetcher"

interface CuentasTabProps {
  empresaId?: string
}

const TIPOS_CUENTA: TipoCuenta[] = ["Activo", "Pasivo", "Patrimonio", "Ingresos", "Gastos", "Costos"]
const TIPOS_AUXILIAR: TipoAuxiliar[] = ["Cliente", "Proveedor", "Banco", "Caja", "Empleado", "Otro"]
const MONEDAS: Moneda[] = ["BOB", "USD"]

export default function CuentasTab({ empresaId }: CuentasTabProps) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [selectedCuenta, setSelectedCuenta] = useState<Cuenta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saldos, setSaldos] = useState<CuentaSaldos[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  
  // Estado del formulario (mapeo UI → DB)
  const [formData, setFormData] = useState<Partial<Cuenta>>({
    empresa_id: empresaId ? parseInt(empresaId) : 1,
    clasificador: "",
    cuenta: "",
    descripcion: "",
    cuenta_padre: null,
    tipo_cuenta: "",
    moneda: "BS",
    nivel: 1,
    permite_auxiliar: false,
    cuenta_presupuestaria: false,
    cuenta_patrimonial: false,
    efectivo: false,
    cuenta_flujo: false,
    aitb: false,
    transaccional: false,
    vigente: true,
  })

  useEffect(() => {
    fetchCuentas(1, false)
  }, [])

  useEffect(() => {
    if (selectedCuenta) {
      // Mapear datos de DB → UI
      setFormData({
        empresa_id: selectedCuenta.empresa_id || empresaId,
        clasificador: selectedCuenta.clasificador || "",
        cuenta: selectedCuenta.cuenta || "",
        descripcion: selectedCuenta.descripcion || "",
        cuenta_padre: selectedCuenta.cuenta_padre || null,
        tipo_cuenta: selectedCuenta.tipo_cuenta || "",
        moneda: selectedCuenta.moneda || "BS",
        nivel: selectedCuenta.nivel || 1,
        permite_auxiliar: selectedCuenta.permite_auxiliar || false,
        cuenta_presupuestaria: selectedCuenta.cuenta_presupuestaria || false,
        cuenta_patrimonial: selectedCuenta.cuenta_patrimonial || false,
        efectivo: selectedCuenta.efectivo || false,
        cuenta_flujo: selectedCuenta.cuenta_flujo || false,
        aitb: selectedCuenta.aitb || false,
        transaccional: selectedCuenta.transaccional || false,
        vigente: selectedCuenta.vigente !== undefined ? selectedCuenta.vigente : true,
      })
      fetchSaldos(selectedCuenta.id)
    } else {
      resetForm()
    }
  }, [selectedCuenta])

  const fetchCuentas = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      console.log("🔍 [CuentasTab] Fetching cuentas, page:", page, "append:", append)
      // Cargar todos los items de una vez con límite alto
      const limit = append ? 100 : 10000
      const response = await api(`/api/contabilidad/cuentas?page=${page}&limit=${limit}`)
      console.log("🔍 [CuentasTab] Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 [CuentasTab] Data recibida:", {
          success: data.success,
          dataLength: data.data?.length || 0,
          total: data.pagination?.total || 0,
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 0
        })
        
        if (append) {
          setCuentas(prev => [...prev, ...(data.data || [])])
        } else {
          setCuentas(data.data || [])
        }
        
        setTotal(data.pagination?.total || 0)
        setCurrentPage(page)
        setHasMore(page < (data.pagination?.totalPages || 0))
      } else {
        // Si la respuesta no es OK, intentar parsear el error
        try {
          const errorData = await response.json()
          // Si es un error de tabla no existe, simplemente usar array vacío
          if (errorData.error?.includes("does not exist") || errorData.error?.includes("relation")) {
            setCuentas([])
          } else {
            toast.error(errorData.error || "Error al cargar las cuentas")
          }
        } catch {
          // Si no se puede parsear, usar array vacío
          setCuentas([])
        }
      }
    } catch (error) {
      console.error("Error fetching cuentas:", error)
      // En caso de error, usar array vacío en lugar de mostrar error
      if (!append) {
        setCuentas([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Scroll infinito - cargar más cuando se acerca al final
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target) return

      const { scrollTop, scrollHeight, clientHeight } = target
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

      if (isNearBottom) {
        console.log("🔍 [CuentasTab] Cargando más items...")
        fetchCuentas(currentPage + 1, true)
      }
    }

    const tableContainer = document.querySelector('[data-table-container]')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => {
        tableContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [hasMore, loadingMore, loading, currentPage])

  const fetchSaldos = async (cuentaId: number) => {
    try {
      const response = await api(`/api/contabilidad/cuentas/${cuentaId}/saldos`)
      if (response.ok) {
        const data = await response.json()
        setSaldos(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching saldos:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      empresa_id: empresaId,
      clasificador: "",
      cuenta: "",
      descripcion: "",
      cuenta_padre: null,
      tipo_cuenta: "",
      moneda: "BS",
      nivel: 1,
      permite_auxiliar: false,
      cuenta_presupuestaria: false,
      cuenta_patrimonial: false,
      efectivo: false,
      cuenta_flujo: false,
      aitb: false,
      transaccional: false,
      vigente: true,
    })
    setSaldos([])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (selectedCuenta) {
        // Actualizar
        const response = await api(`/api/contabilidad/cuentas/${selectedCuenta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          toast.success("Cuenta actualizada correctamente")
          await fetchCuentas()
          const updated = await response.json()
          setSelectedCuenta(updated.data)
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al actualizar la cuenta")
        }
      } else {
        // Crear
        const response = await api("/api/contabilidad/cuentas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          toast.success("Cuenta creada correctamente")
          await fetchCuentas()
          const newCuenta = await response.json()
          setSelectedCuenta(newCuenta.data)
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear la cuenta")
        }
      }
    } catch (error) {
      console.error("Error saving cuenta:", error)
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCuenta) return
    if (!confirm("¿Estás seguro de que quieres eliminar esta cuenta?")) return

    try {
      const response = await api(`/api/contabilidad/cuentas/${selectedCuenta.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        toast.success("Cuenta eliminada correctamente")
        setSelectedCuenta(null)
        await fetchCuentas()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar la cuenta")
      }
    } catch (error) {
      console.error("Error deleting cuenta:", error)
      toast.error("Error de conexión")
    }
  }

  const handleNew = () => {
    setSelectedCuenta(null)
    resetForm()
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Tabla superior */}
        <Card>
          <CardHeader>
            <CardTitle>Cuentas</CardTitle>
            <CardDescription>Lista de cuentas contables</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
              <div 
                className="overflow-x-auto max-h-[600px] overflow-y-auto"
                data-table-container
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clasificador</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Transaccional</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          No hay cuentas registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      cuentas.map((cuenta) => (
                        <TableRow
                          key={cuenta.id}
                          onClick={() => setSelectedCuenta(cuenta)}
                          className={`cursor-pointer ${
                            selectedCuenta?.id === cuenta.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <TableCell className="font-mono">{cuenta.clasificador}</TableCell>
                          <TableCell className="font-mono">{cuenta.cuenta}</TableCell>
                          <TableCell>{cuenta.descripcion}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cuenta.moneda}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{cuenta.nivel}</TableCell>
                          <TableCell>
                            {cuenta.vigente ? (
                              <Badge className="bg-green-100 text-green-800">Activa</Badge>
                            ) : (
                              <Badge variant="secondary">Inactiva</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {cuenta.transaccional ? (
                              <Badge className="bg-blue-100 text-blue-800">Sí</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Indicador de carga más items */}
                {loadingMore && (
                  <div className="text-center py-4 text-gray-500">
                    Cargando más cuentas...
                  </div>
                )}
                
                {/* Información de paginación */}
                {!loadingMore && cuentas.length > 0 && (
                  <div className="text-center py-2 text-sm text-gray-500 border-t">
                    Mostrando {cuentas.length} de {total} cuentas
                    {hasMore && " - Desplázate hacia abajo para cargar más"}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario inferior */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedCuenta ? "Editar Cuenta" : "Nueva Cuenta"}
                </CardTitle>
                <CardDescription>
                  {selectedCuenta
                    ? "Modifica la información de la cuenta seleccionada"
                    : "Complete la información para crear una nueva cuenta"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva
                </Button>
                {selectedCuenta && (
                  <Button variant="outline" size="sm" onClick={handleDelete} className="border-gray-300">
                    <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                    <span className="text-gray-700">Eliminar</span>
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Empresa (solo lectura) */}
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.empresa_id || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Clasificador */}
              <div className="space-y-2">
                <Label htmlFor="clasificador">Clasificador</Label>
                <Input
                  id="clasificador"
                  value={formData.clasificador || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, clasificador: e.target.value })
                  }
                  className="font-mono"
                />
              </div>

              {/* Cuenta */}
              <div className="space-y-2">
                <Label htmlFor="cuenta">Cuenta</Label>
                <Input
                  id="cuenta"
                  value={formData.cuenta || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cuenta: e.target.value })
                  }
                  disabled={!!selectedCuenta}
                  className="font-mono bg-gray-50"
                  title={selectedCuenta ? "El código de cuenta no se puede modificar" : ""}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              {/* Cuenta Mayor (cuenta_padre) */}
              <div className="space-y-2">
                <Label htmlFor="cuenta_padre">Cuenta Mayor</Label>
                <Input
                  id="cuenta_padre"
                  value={formData.cuenta_padre || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cuenta_padre: e.target.value || null })
                  }
                  className="font-mono"
                  placeholder="Código de cuenta padre"
                />
              </div>

              {/* Tipo de Cuenta */}
              <div className="space-y-2">
                <Label htmlFor="tipo_cuenta">Tipo de Cuenta</Label>
                <Select
                  value={formData.tipo_cuenta || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_cuenta: value === "none" ? "" : (value || "") })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar tipo</SelectItem>
                    {TIPOS_CUENTA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={formData.moneda || "BOB"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, moneda: value as Moneda })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map((moneda) => (
                      <SelectItem key={moneda} value={moneda}>
                        {moneda}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nivel */}
              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel</Label>
                <Input
                  id="nivel"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.nivel || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Checkboxes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cuenta_presupuestaria"
                  checked={formData.cuenta_presupuestaria || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cuenta_presupuestaria: !!checked })
                  }
                />
                <Label htmlFor="cuenta_presupuestaria" className="cursor-pointer">
                  Cuenta Presupuestaria
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cuenta_patrimonial"
                  checked={formData.cuenta_patrimonial || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cuenta_patrimonial: !!checked })
                  }
                />
                <Label htmlFor="cuenta_patrimonial" className="cursor-pointer">
                  Cuenta Patrimonial
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="efectivo"
                  checked={formData.efectivo || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, efectivo: !!checked })
                  }
                />
                <Label htmlFor="efectivo" className="cursor-pointer">
                  Efectivo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cuenta_flujo"
                  checked={formData.cuenta_flujo || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cuenta_flujo: !!checked })
                  }
                />
                <Label htmlFor="cuenta_flujo" className="cursor-pointer">
                  Cuenta Flujo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aitb"
                  checked={formData.aitb || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, aitb: !!checked })
                  }
                />
                <Label htmlFor="aitb" className="cursor-pointer">
                  A.I.T.B
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transaccional"
                  checked={formData.transaccional || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, transaccional: !!checked })
                  }
                />
                <Label htmlFor="transaccional" className="cursor-pointer">
                  Transaccional
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vigente"
                  checked={formData.vigente !== undefined ? formData.vigente : true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, vigente: !!checked })
                  }
                />
                <Label htmlFor="vigente" className="cursor-pointer">
                  Vigente
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel lateral de saldos */}
      {selectedCuenta && (
        <Card className="w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle>Saldos de Cuenta</CardTitle>
            <CardDescription>Saldo por gestión</CardDescription>
          </CardHeader>
          <CardContent>
            {saldos.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay saldos registrados
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestión</TableHead>
                        <TableHead className="text-right">Inicial</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saldos.map((saldo, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{saldo.gestion}</TableCell>
                          <TableCell className="text-right font-mono">
                            {saldo.inicial.toLocaleString("es-BO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {saldo.debe.toLocaleString("es-BO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {saldo.haber.toLocaleString("es-BO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {saldo.saldo.toLocaleString("es-BO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

