"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Save, Edit, Trash2, FileX } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import EmpleadoDatosGeneralesTab from "./EmpleadoDatosGeneralesTab"
import EmpleadoContratosTab from "./EmpleadoContratosTab"
import EmpleadoComplementariosTab from "./EmpleadoComplementariosTab"
import EmpleadoDependientesTab from "./EmpleadoDependientesTab"
import { empleadoMockInicial, type EmpleadoCompleto } from "@/lib/planillas/empleadosMock"

export default function RegistroEmpleadosPage() {
  const [empleado, setEmpleado] = useState<EmpleadoCompleto>(empleadoMockInicial)
  const [modoEdicion, setModoEdicion] = useState(false)

  const handleNuevo = () => {
    toast.info("Mock: Nuevo empleado")
    setModoEdicion(true)
  }

  const handleGuardar = () => {
    toast.success("Mock: Empleado guardado correctamente")
    setModoEdicion(false)
  }

  const handleEditar = () => {
    toast.info("Mock: Modo edición activado")
    setModoEdicion(true)
  }

  const handleEliminar = () => {
    if (confirm("¿Está seguro de eliminar este empleado?")) {
      toast.success("Mock: Empleado eliminado")
    }
  }

  const handleLimpiar = () => {
    if (confirm("¿Está seguro de limpiar todos los datos?")) {
      setEmpleado(empleadoMockInicial)
      toast.info("Mock: Formulario limpiado")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registro de Empleados</h1>
            <p className="text-gray-600 mt-2">
              Gestión completa de información de empleados (mock)
            </p>
          </div>
          
          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleNuevo} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
            <Button variant="outline" size="sm" onClick={handleGuardar} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button variant="outline" size="sm" onClick={handleEditar} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={handleEliminar} className="gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLimpiar} className="gap-2">
              <FileX className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Contenido con Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="datos-generales" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="datos-generales">Datos Generales</TabsTrigger>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
                <TabsTrigger value="complementarios">Complementarios</TabsTrigger>
                <TabsTrigger value="dependientes">Dependientes</TabsTrigger>
              </TabsList>

              <TabsContent value="datos-generales" className="mt-0">
                <EmpleadoDatosGeneralesTab
                  datos={empleado.datos_generales}
                  onChange={(datos) => setEmpleado({ ...empleado, datos_generales: datos })}
                  readonly={!modoEdicion}
                />
              </TabsContent>

              <TabsContent value="contratos" className="mt-0">
                <EmpleadoContratosTab
                  contratos={empleado.contratos}
                  onChange={(contratos) => setEmpleado({ ...empleado, contratos })}
                  readonly={!modoEdicion}
                />
              </TabsContent>

              <TabsContent value="complementarios" className="mt-0">
                <EmpleadoComplementariosTab
                  datos={empleado.complementarios}
                  onChange={(datos) => setEmpleado({ ...empleado, complementarios: datos })}
                  readonly={!modoEdicion}
                />
              </TabsContent>

              <TabsContent value="dependientes" className="mt-0">
                <EmpleadoDependientesTab
                  datos={empleado.dependientes}
                  onChange={(datos) => setEmpleado({ ...empleado, dependientes: datos })}
                  readonly={!modoEdicion}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

