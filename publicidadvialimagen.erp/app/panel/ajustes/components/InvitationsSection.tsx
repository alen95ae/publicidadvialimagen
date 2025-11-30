"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Copy, ExternalLink, Clock, CheckCircle, XCircle, Key, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: string;
  email: string;
  rol: string;
  rolNombre: string; // Obligatorio - siempre debe venir del backend
  token: string;
  estado: "pendiente" | "usado" | "expirado";
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaUso?: string;
  enlace: string;
}

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
}

export default function InvitationsSection() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();

  // Formulario para crear invitación
  const [formData, setFormData] = useState({
    email: "",
    rol: "",
    horasValidez: 72,
  });

  // Formulario para cambiar contraseña
  const [changePasswordData, setChangePasswordData] = useState({
    email: "",
    horasValidez: 72,
  });

  useEffect(() => {
    loadInvitations();
    loadRoles();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/ajustes/invitaciones?${params}`, {
        credentials: "include"
      });
      const data = await response.json();
      
      if (response.ok) {
        setInvitations(data.invitations);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar invitaciones",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar invitaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch("/api/ajustes/roles", {
        credentials: "include"
      });
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const handleCreateInvitation = async () => {
    // Validación del formulario
    if (!formData.email) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!formData.rol) {
      toast({
        title: "Error",
        description: "Debes seleccionar un rol",
        variant: "destructive",
      });
      return;
    }

    if (!formData.horasValidez || formData.horasValidez <= 0) {
      toast({
        title: "Error",
        description: "Las horas de validez deben ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/ajustes/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Invitación creada correctamente",
        });
        setIsCreateDialogOpen(false);
        setFormData({ email: "", rol: "", horasValidez: 72 });
        loadInvitations();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear invitación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear invitación",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    // Validación del formulario
    if (!changePasswordData.email) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!changePasswordData.horasValidez || changePasswordData.horasValidez <= 0) {
      toast({
        title: "Error",
        description: "Las horas de validez deben ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/ajustes/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: changePasswordData.email,
          horasValidez: changePasswordData.horasValidez,
          cambioPassword: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Invitación para cambiar contraseña creada correctamente",
        });
        setIsChangePasswordDialogOpen(false);
        setChangePasswordData({ email: "", horasValidez: 72 });
        loadInvitations();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear invitación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear invitación",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Éxito",
        description: "Enlace copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleEliminarInvitacion = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta invitación?")) {
      return;
    }

    try {
      const response = await fetch(`/api/ajustes/invitaciones`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Invitación eliminada correctamente",
        });
        loadInvitations();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar invitación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar invitación",
        variant: "destructive",
      });
    }
  };


  // Función eliminada - ya no se necesita porque el backend siempre devuelve rolNombre

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "usado":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Usado</Badge>;
      case "expirado":
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const isExpired = (fechaExpiracion: string) => {
    return new Date(fechaExpiracion) < new Date();
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (statusFilter && statusFilter !== "all" && invitation.estado !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="usado">Usadas</SelectItem>
            <SelectItem value="expirado">Expiradas</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadInvitations} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Botón crear invitación */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invitaciones ({filteredInvitations.length})</h3>
        <div className="flex gap-2">
          <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                  Genera un enlace para que un usuario existente pueda cambiar su contraseña
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="change-password-email">Email del Usuario</Label>
                  <Input
                    id="change-password-email"
                    type="email"
                    value={changePasswordData.email}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="change-password-horasValidez">Validez (horas)</Label>
                  <Select value={changePasswordData.horasValidez.toString()} onValueChange={(value) => setChangePasswordData({ ...changePasswordData, horasValidez: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                      <SelectItem value="72">72 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsChangePasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Crear Enlace
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear Invitación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Invitación</DialogTitle>
              <DialogDescription>
                Genera un enlace de invitación para un nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email del Invitado</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="rol">Rol Asignado</Label>
                <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="horasValidez">Validez (horas)</Label>
                <Select value={formData.horasValidez.toString()} onValueChange={(value) => setFormData({ ...formData, horasValidez: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="72">72 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateInvitation}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Crear Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tabla de invitaciones */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Enlace</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Cargando invitaciones...
                </TableCell>
              </TableRow>
            ) : filteredInvitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron invitaciones
                </TableCell>
              </TableRow>
            ) : (
              filteredInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invitation.rolNombre}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invitation.estado)}
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.fechaCreacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className={isExpired(invitation.fechaExpiracion) ? "text-red-600" : ""}>
                        {new Date(invitation.fechaExpiracion).toLocaleDateString()}
                      </span>
                      {isExpired(invitation.fechaExpiracion) && invitation.estado === "pendiente" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(invitation.enlace)}
                        disabled={invitation.estado !== "pendiente"}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invitation.enlace, "_blank")}
                        disabled={invitation.estado !== "pendiente"}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Eliminar"
                        onClick={() => handleEliminarInvitacion(invitation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
