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
        
        // Inicializar matriz de permisos basada en los permisos disponibles
        const initialMatrix: Record<string, Record<string, boolean>> = {};
        (data.permisos || []).forEach((permiso: Permiso) => {
          if (!initialMatrix[permiso.modulo]) {
            initialMatrix[permiso.modulo] = {};
          }
          initialMatrix[permiso.modulo][permiso.accion] = false;
        });
        setPermisoMatrix(initialMatrix);
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
      // Obtener lista de permiso_id seleccionados
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

      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos: permisoIds,
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
        permisos.forEach(permiso => {
          if (!initialMatrix[permiso.modulo]) {
            initialMatrix[permiso.modulo] = {};
          }
          initialMatrix[permiso.modulo][permiso.accion] = false;
        });
        setPermisoMatrix(initialMatrix);
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
      // Obtener lista de permiso_id seleccionados
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

      const payload = {
        id: editingRole.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos: permisoIds,
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
    // Cargar permisos del rol en la matriz
    setPermisoMatrix({ ...role.permisos });
    setIsEditDialogOpen(true);
  };

  const handlePermissionChange = (modulo: string, accion: string, value: boolean) => {
    setPermisoMatrix(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
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

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  // Obtener módulos únicos ordenados
  const modulos = Object.keys(permisosPorModulo).sort();

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
            permisos.forEach(permiso => {
              if (!initialMatrix[permiso.modulo]) {
                initialMatrix[permiso.modulo] = {};
              }
              initialMatrix[permiso.modulo][permiso.accion] = false;
            });
            setPermisoMatrix(initialMatrix);
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
