"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Shield, Lock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
  esPredefinido: boolean;
}

interface Module {
  key: string;
  name: string;
  description: string;
}

const MODULES: Module[] = [
  { key: "soportes", name: "Soportes", description: "Gestión de soportes publicitarios" },
  { key: "contactos", name: "Contactos", description: "Base de datos de contactos" },
  { key: "mensajes", name: "Mensajes", description: "Sistema de mensajería" },
  { key: "inventario", name: "Inventario", description: "Control de inventario" },
  { key: "calendario", name: "Calendario", description: "Planificación y eventos" },
  { key: "produccion", name: "Producción", description: "Gestión de producción" },
  { key: "ventas", name: "Ventas", description: "Gestión de ventas y CRM" },
  { key: "contabilidad", name: "Contabilidad", description: "Gestión financiera" },
  { key: "reservas", name: "Reservas", description: "Sistema de reservas" },
  { key: "clientes", name: "Clientes", description: "Gestión de clientes" },
  { key: "empleados", name: "Empleados", description: "Recursos humanos" },
  { key: "diseno", name: "Diseño", description: "Herramientas de diseño" },
  { key: "sitio", name: "Sitio Web", description: "Gestión del sitio web" },
  { key: "ajustes", name: "Ajustes", description: "Configuración del sistema" },
];

export default function RolesSection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  // Formulario para crear/editar rol
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    permisos: {} as Record<string, { view: boolean; edit: boolean; delete: boolean }>,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ajustes/roles");
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
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
      const response = await fetch("/api/ajustes/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol creado correctamente",
        });
        setIsCreateDialogOpen(false);
        setFormData({ nombre: "", descripcion: "", permisos: {} });
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
      const response = await fetch("/api/ajustes/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRole.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol actualizado correctamente",
        });
        setIsEditDialogOpen(false);
        setEditingRole(null);
        setFormData({ nombre: "", descripcion: "", permisos: {} });
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
      permisos: { ...role.permisos },
    });
    setIsEditDialogOpen(true);
  };

  const handlePermissionChange = (moduleKey: string, permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [moduleKey]: {
          ...prev.permisos[moduleKey],
          [permission]: value,
        },
      },
    }));
  };

  const initializePermissions = () => {
    const initialPermissions: Record<string, { view: boolean; edit: boolean; delete: boolean }> = {};
    MODULES.forEach(module => {
      initialPermissions[module.key] = {
        view: false,
        edit: false,
        delete: false,
      };
    });
    return initialPermissions;
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view": return <Eye className="h-4 w-4" />;
      case "edit": return <Edit className="h-4 w-4" />;
      case "delete": return <Trash2 className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case "view": return "Ver";
      case "edit": return "Editar";
      case "delete": return "Eliminar";
      default: return permission;
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón crear rol */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Roles del Sistema ({roles.length})</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  {MODULES.map((module) => (
                    <Card key={module.key}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{module.name}</CardTitle>
                        <CardDescription className="text-xs">{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-4">
                          {["view", "edit", "delete"].map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              {getPermissionIcon(permission)}
                              <Label htmlFor={`${module.key}-${permission}`} className="text-sm">
                                {getPermissionLabel(permission)}
                              </Label>
                              <Switch
                                id={`${module.key}-${permission}`}
                                checked={formData.permisos[module.key]?.[permission as keyof typeof formData.permisos[typeof module.key]] || false}
                                onCheckedChange={(checked) => handlePermissionChange(module.key, permission, checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRole}>
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
                  <div className="flex items-center space-x-2">
                    {role.esPredefinido && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Predefinido
                      </Badge>
                    )}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!role.esPredefinido && (
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
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription>{role.descripcion}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Permisos:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {role.permisos && Object.entries(role.permisos).map(([moduleKey, permissions]) => {
                      const module = MODULES.find(m => m.key === moduleKey);
                      if (!module) return null;
                      
                      const hasAnyPermission = permissions && Object.values(permissions).some(Boolean);
                      if (!hasAnyPermission) return null;

                      return (
                        <div key={moduleKey} className="text-xs">
                          <div className="font-medium">{module.name}</div>
                          <div className="flex space-x-1">
                            {permissions && Object.entries(permissions).map(([perm, enabled]) => (
                              enabled && (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {getPermissionLabel(perm)}
                                </Badge>
                              )
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
                {MODULES.map((module) => (
                  <Card key={module.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{module.name}</CardTitle>
                      <CardDescription className="text-xs">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4">
                        {["view", "edit", "delete"].map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            {getPermissionIcon(permission)}
                            <Label htmlFor={`edit-${module.key}-${permission}`} className="text-sm">
                              {getPermissionLabel(permission)}
                            </Label>
                            <Switch
                              id={`edit-${module.key}-${permission}`}
                              checked={formData.permisos[module.key]?.[permission as keyof typeof formData.permisos[typeof module.key]] || false}
                              onCheckedChange={(checked) => handlePermissionChange(module.key, permission, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditRole}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
