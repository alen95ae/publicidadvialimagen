"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Permiso {
  id: string;
  modulo: string;
  accion: string;
}

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: Record<string, Record<string, boolean>>; // { modulo: { accion: boolean } }
}

export default function RolesSection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  // Formulario para crear/editar rol
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  // Matriz de permisos: { modulo: { accion: boolean } }
  const [permisoMatrix, setPermisoMatrix] = useState<Record<string, Record<string, boolean>>>({});
  
  // Estado para permisos técnicos: { id: string, accion: string, asignado: boolean }
  const [permisosTecnicos, setPermisosTecnicos] = useState<Array<{ id: string; accion: string; asignado: boolean }>>([]);

  // Función auxiliar para normalizar módulos (elimina acentos, espacios, mayúsculas, etc.)
  // Debe estar aquí al principio para poder usarse en todas las funciones
  const normalizarModulo = (modulo: string | undefined | null): string => {
    if (!modulo) return '';
    return modulo
      .normalize("NFD")      // elimina acentos
      .replace(/[\u0300-\u036f]/g, "")  // elimina diacríticos
      .trim()                 // elimina espacios al inicio/final
      .toLowerCase();         // convierte a minúsculas
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ajustes/roles");
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles || []);
        setPermisos(data.permisos || []);
        
        // Inicializar matriz de permisos basada en los permisos disponibles (excluyendo técnicos y "ver dueño de casa")
        const initialMatrix: Record<string, Record<string, boolean>> = {};
        const permisosTecnicosInicial: Array<{ id: string; accion: string; asignado: boolean }> = [];
        
        (data.permisos || []).forEach((permiso: Permiso) => {
          // Normalizar módulo para evitar errores por espacios, acentos o mayúsculas
          const moduloNormalizado = normalizarModulo(permiso.modulo);
          
          // Incluir en Funciones Técnicas: todos los permisos del módulo "tecnico" (normalizado)
          const esTecnico = moduloNormalizado === 'tecnico';
          
          if (esTecnico) {
            // SOLO funciones técnicas - NO meter en initialMatrix
            permisosTecnicosInicial.push({
              id: permiso.id,
              accion: permiso.accion,
              asignado: false,
            });
            // ❗ Clave: evitar que técnico entre en initialMatrix
            return; // Continuar con el siguiente permiso sin tocar initialMatrix
          }
          
          // Módulos normales - usar módulo normalizado como clave
          if (!initialMatrix[moduloNormalizado]) {
            initialMatrix[moduloNormalizado] = {};
          }
          initialMatrix[moduloNormalizado][permiso.accion] = false;
        });
        // ❗ Eliminar "tecnico" de initialMatrix para que NUNCA aparezca en "Permisos por Módulo"
        delete initialMatrix["tecnico"];
        setPermisoMatrix(initialMatrix);
        setPermisosTecnicos(ordenarPermisosTecnicos(permisosTecnicosInicial));
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      // Obtener lista de permiso_id seleccionados (módulos normales)
      const permisoIds: string[] = [];
      Object.entries(permisoMatrix).forEach(([modulo, acciones]) => {
        Object.entries(acciones).forEach(([accion, activo]) => {
          if (activo) {
            const permiso = permisos.find(p => p.modulo === modulo && p.accion === accion);
            if (permiso) {
              permisoIds.push(permiso.id);
            }
          }
        });
      });

      // Obtener IDs de permisos técnicos seleccionados
      const permisosTecnicosIds = permisosTecnicos
        .filter(pt => pt.asignado)
        .map(pt => pt.id);

      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos: permisoIds,
        permisosTecnicos: permisosTecnicosIds,
      };
      
      console.log("📤 Enviando datos para crear rol:", payload);

      const response = await fetch("/api/ajustes/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol creado correctamente",
        });
        setIsCreateDialogOpen(false);
        setFormData({ nombre: "", descripcion: "" });
        // Resetear matriz de permisos
        const initialMatrix: Record<string, Record<string, boolean>> = {};
        const permisosTecnicosReset: Array<{ id: string; accion: string; asignado: boolean }> = [];
        permisos.forEach(permiso => {
          // Normalizar módulo para evitar errores por espacios, acentos o mayúsculas
          const moduloNormalizado = normalizarModulo(permiso.modulo);
          
          // Incluir en Funciones Técnicas: todos los permisos del módulo "tecnico" (normalizado)
          const esTecnico = moduloNormalizado === 'tecnico';
          
          if (esTecnico) {
            // SOLO funciones técnicas - NO meter en initialMatrix
            permisosTecnicosReset.push({
              id: permiso.id,
              accion: permiso.accion,
              asignado: false,
            });
            // ❗ Clave: evitar que técnico entre en initialMatrix
            return; // Continuar con el siguiente permiso sin tocar initialMatrix
          }
          
          // Módulos normales - usar módulo normalizado como clave
          if (!initialMatrix[moduloNormalizado]) {
            initialMatrix[moduloNormalizado] = {};
          }
          initialMatrix[moduloNormalizado][permiso.accion] = false;
        });
        // ❗ Eliminar "tecnico" de initialMatrix para que NUNCA aparezca en "Permisos por Módulo"
        delete initialMatrix["tecnico"];
        setPermisoMatrix(initialMatrix);
        setPermisosTecnicos(ordenarPermisosTecnicos(permisosTecnicosReset));
        loadRoles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear rol",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear rol",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = async () => {
    if (!editingRole) return;

    try {
      // Obtener lista de permiso_id seleccionados (módulos normales)
      const permisoIds: string[] = [];
      Object.entries(permisoMatrix).forEach(([modulo, acciones]) => {
        Object.entries(acciones).forEach(([accion, activo]) => {
          if (activo) {
            const permiso = permisos.find(p => p.modulo === modulo && p.accion === accion);
            if (permiso) {
              permisoIds.push(permiso.id);
            }
          }
        });
      });

      // Obtener IDs de permisos técnicos seleccionados
      const permisosTecnicosIds = permisosTecnicos
        .filter(pt => pt.asignado)
        .map(pt => pt.id);

      const payload = {
        id: editingRole.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos: permisoIds,
        permisosTecnicos: permisosTecnicosIds,
      };
      
      console.log("📤 Enviando datos para editar rol:", payload);

      const response = await fetch("/api/ajustes/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol actualizado correctamente",
        });
        setIsEditDialogOpen(false);
        setEditingRole(null);
        setFormData({ nombre: "", descripcion: "" });
        loadRoles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al actualizar rol",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar rol",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/ajustes/roles?id=${roleId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol eliminado correctamente",
        });
        loadRoles();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar rol",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar rol",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion,
    });
    // Cargar permisos del rol en la matriz (excluyendo técnico)
    const permisosSinTecnico: Record<string, Record<string, boolean>> = {};
    Object.entries(role.permisos).forEach(([modulo, acciones]) => {
      // Normalizar módulo para comparación correcta
      const moduloNormalizado = normalizarModulo(modulo);
      if (moduloNormalizado !== 'tecnico') {
        // Usar módulo normalizado como clave
        permisosSinTecnico[moduloNormalizado] = acciones;
      }
    });
    // ❗ Eliminar "tecnico" de permisosSinTecnico para que NUNCA aparezca en "Permisos por Módulo"
    delete permisosSinTecnico["tecnico"];
    setPermisoMatrix(permisosSinTecnico);
    // Cargar permisos técnicos del rol
    if ((role as any).permisosTecnicos) {
      setPermisosTecnicos(ordenarPermisosTecnicos((role as any).permisosTecnicos));
    } else {
      // Si no vienen permisos técnicos, inicializar desde permisos disponibles
      const permisosTecnicosInicial: Array<{ id: string; accion: string; asignado: boolean }> = [];
      permisos.filter(p => normalizarModulo(p.modulo) === 'tecnico').forEach(permiso => {
        permisosTecnicosInicial.push({
          id: permiso.id,
          accion: permiso.accion,
          asignado: false,
        });
      });
      setPermisosTecnicos(ordenarPermisosTecnicos(permisosTecnicosInicial));
    }
    setIsEditDialogOpen(true);
  };

  const handlePermissionChange = (modulo: string, accion: string, value: boolean) => {
    // Normalizar módulo para consistencia
    const moduloNormalizado = normalizarModulo(modulo);
    // No permitir modificar permisos técnicos desde aquí
    if (moduloNormalizado === 'tecnico') return;
    
    setPermisoMatrix(prev => ({
      ...prev,
      [moduloNormalizado]: {
        ...prev[moduloNormalizado],
        [accion]: value,
      },
    }));
  };

  const getPermissionIcon = (accion: string) => {
    switch (accion) {
      case "ver": return <Eye className="h-4 w-4" />;
      case "editar": return <Edit className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      case "eliminar": return <Trash2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPermissionLabel = (accion: string) => {
    switch (accion) {
      case "ver": return "Ver";
      case "editar": return "Editar";
      case "admin": return "Admin";
      case "eliminar": return "Eliminar";
      default: return accion;
    }
  };

  // Agrupar permisos por módulo (excluyendo técnicos)
  const permisosPorModulo = permisos
    .filter(p => normalizarModulo(p.modulo) !== 'tecnico')
    .reduce((acc, permiso) => {
      // Usar módulo normalizado como clave
      const moduloNormalizado = normalizarModulo(permiso.modulo);
      if (!acc[moduloNormalizado]) {
        acc[moduloNormalizado] = [];
      }
      acc[moduloNormalizado].push(permiso);
      return acc;
    }, {} as Record<string, Permiso[]>);

  // Obtener módulos únicos ordenados
  const modulos = Object.keys(permisosPorModulo).sort();

  // Función para cambiar estado de permiso técnico
  const handlePermisoTecnicoChange = (id: string, checked: boolean) => {
    setPermisosTecnicos(prev => 
      prev.map(pt => pt.id === id ? { ...pt, asignado: checked } : pt)
    );
  };

  // Función para ordenar permisos técnicos: "ver propietario soportes" -> "ver dueño de casa" -> "descargar ot" -> resto
  const ordenarPermisosTecnicos = (permisos: Array<{ id: string; accion: string; asignado: boolean }>) => {
    return [...permisos].sort((a, b) => {
      const accionA = a.accion.toLowerCase();
      const accionB = b.accion.toLowerCase();
      
      // Función auxiliar para obtener el orden de prioridad
      const getOrder = (accion: string): number => {
        if (accion === "ver propietario soportes") return 0;
        if (accion === "ver dueño de casa") return 1;
        if (accion === "descargar ot") return 2;
        return 3; // Resto de permisos
      };
      
      const orderA = getOrder(accionA);
      const orderB = getOrder(accionB);
      
      // Si tienen diferente prioridad, ordenar por prioridad
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Si tienen la misma prioridad (ambos son 3), orden alfabético
      return accionA.localeCompare(accionB);
    });
  };

  return (
    <div className="space-y-6">
      {/* Botón crear rol */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Roles del Sistema ({roles.length})</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (open) {
            // Inicializar matriz de permisos cuando se abre el diálogo
            const initialMatrix: Record<string, Record<string, boolean>> = {};
            const permisosTecnicosInicial: Array<{ id: string; accion: string; asignado: boolean }> = [];
            permisos.forEach(permiso => {
              // Normalizar módulo para evitar errores por espacios, acentos o mayúsculas
              const moduloNormalizado = normalizarModulo(permiso.modulo);
              
              // Incluir en Funciones Técnicas: todos los permisos del módulo "tecnico" (normalizado)
              const esTecnico = moduloNormalizado === 'tecnico';
              
              if (esTecnico) {
                // SOLO funciones técnicas - NO meter en initialMatrix
                permisosTecnicosInicial.push({
                  id: permiso.id,
                  accion: permiso.accion,
                  asignado: false,
                });
                // ❗ Clave: evitar que técnico entre en initialMatrix
                return; // Continuar con el siguiente permiso sin tocar initialMatrix
              }
              
              // Módulos normales - usar módulo normalizado como clave
              if (!initialMatrix[moduloNormalizado]) {
                initialMatrix[moduloNormalizado] = {};
              }
              initialMatrix[moduloNormalizado][permiso.accion] = false;
            });
            // ❗ Eliminar "tecnico" de initialMatrix para que NUNCA aparezca en "Permisos por Módulo"
            delete initialMatrix["tecnico"];
            setPermisoMatrix(initialMatrix);
            setPermisosTecnicos(ordenarPermisosTecnicos(permisosTecnicosInicial));
            setFormData({ nombre: "", descripcion: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>
                Define un nuevo rol con permisos específicos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Rol</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Editor Avanzado"
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del rol"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-base font-semibold">Permisos por Módulo</Label>
                <div className="mt-4 space-y-4">
                  {modulos.map((modulo) => {
                    const permisosModulo = permisosPorModulo[modulo];
                    return (
                      <Card key={modulo}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm capitalize">{modulo}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {permisosModulo.map((permiso) => (
                              <div key={permiso.id} className="flex items-center space-x-2">
                                {getPermissionIcon(permiso.accion)}
                                <Label htmlFor={`create-${permiso.id}`} className="text-sm">
                                  {getPermissionLabel(permiso.accion)}
                                </Label>
                                <Switch
                                  id={`create-${permiso.id}`}
                                  checked={permisoMatrix[modulo]?.[permiso.accion] || false}
                                  onCheckedChange={(checked) => handlePermissionChange(modulo, permiso.accion, checked)}
                                  className="data-[state=checked]:bg-red-600"
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Sección Funciones Técnicas */}
              <div>
                <Label className="text-base font-semibold">Funciones Técnicas</Label>
                <div className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {permisosTecnicos.map((permisoTecnico) => (
                          <div key={permisoTecnico.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <Label htmlFor={`create-tecnico-${permisoTecnico.id}`} className="text-sm font-normal cursor-pointer">
                              {permisoTecnico.accion}
                            </Label>
                            <Switch
                              id={`create-tecnico-${permisoTecnico.id}`}
                              checked={permisoTecnico.asignado}
                              onCheckedChange={(checked) => handlePermisoTecnicoChange(permisoTecnico.id, checked)}
                              className="data-[state=checked]:bg-red-600"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCreateRole}>
                Crear Rol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            Cargando roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron roles
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{role.nombre}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el rol {role.nombre}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>{role.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Permisos:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(role.permisos).map(([modulo, acciones]) => {
                      const permisosActivos = Object.entries(acciones)
                        .filter(([_, activo]) => activo)
                        .map(([accion, _]) => getPermissionLabel(accion));
                      
                      if (permisosActivos.length === 0) return null;

                      return (
                        <div key={modulo} className="text-xs">
                          <div className="font-medium capitalize">{modulo}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {permisosActivos.map((accion) => (
                              <Badge key={accion} variant="outline" className="text-xs">
                                {accion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Modifica los permisos del rol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre del Rol</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Editor Avanzado"
                />
              </div>
              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Input
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del rol"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-base font-semibold">Permisos por Módulo</Label>
              <div className="mt-4 space-y-4">
                {modulos.map((modulo) => {
                  const permisosModulo = permisosPorModulo[modulo];
                  return (
                    <Card key={modulo}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm capitalize">{modulo}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {permisosModulo.map((permiso) => (
                            <div key={permiso.id} className="flex items-center space-x-2">
                              {getPermissionIcon(permiso.accion)}
                              <Label htmlFor={`edit-${permiso.id}`} className="text-sm">
                                {getPermissionLabel(permiso.accion)}
                              </Label>
                              <Switch
                                id={`edit-${permiso.id}`}
                                checked={permisoMatrix[modulo]?.[permiso.accion] || false}
                                onCheckedChange={(checked) => handlePermissionChange(modulo, permiso.accion, checked)}
                                className="data-[state=checked]:bg-red-600"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sección Funciones Técnicas */}
            <div>
              <Label className="text-base font-semibold">Funciones Técnicas</Label>
              <div className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {permisosTecnicos.map((permisoTecnico) => (
                        <div key={permisoTecnico.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <Label htmlFor={`tecnico-${permisoTecnico.id}`} className="text-sm font-normal cursor-pointer">
                            {permisoTecnico.accion}
                          </Label>
                          <Switch
                            id={`tecnico-${permisoTecnico.id}`}
                            checked={permisoTecnico.asignado}
                            onCheckedChange={(checked) => handlePermisoTecnicoChange(permisoTecnico.id, checked)}
                            className="data-[state=checked]:bg-red-600"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleEditRole}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
