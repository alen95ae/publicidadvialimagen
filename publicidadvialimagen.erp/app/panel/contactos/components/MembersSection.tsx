"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, UserCheck, UserX, MoreHorizontal, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  rol_id?: string;
  fechaCreacion: string;
  ultimoAcceso?: string;
  imagen_usuario?: any;
  vendedor?: boolean;
}

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
}

export default function MembersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Formulario para editar usuario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol_id: "",
  });

  // Estados para imagen de perfil
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      // Filtrar solo usuarios con rol "invitado"
      params.append("role", "invitado");

      const response = await fetch(`/api/ajustes/usuarios?${params}`, {
        credentials: "include"
      });
      const data = await response.json();
      
      if (response.ok) {
        // Filtrar adicionalmente por rol "invitado" en el frontend por si acaso
        const invitados = data.users.filter((user: User) => 
          user.rol?.toLowerCase() === "invitado"
        );
        setUsers(invitados);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar miembros",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar miembros",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile || !editingUser) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`/api/ajustes/usuarios/image?userId=${editingUser.id}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: "Imagen de perfil actualizada correctamente",
        });
        setImageFile(null);
        loadUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al subir imagen",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Error al subir imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      // Si hay una imagen pendiente de subir, subirla primero
      if (imageFile) {
        setUploadingImage(true);
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);

        const imageResponse = await fetch(`/api/ajustes/usuarios/image?userId=${editingUser.id}`, {
          method: 'POST',
          credentials: 'include',
          body: formDataImage,
        });

        const imageData = await imageResponse.json();

        if (!imageResponse.ok || !imageData.success) {
          toast({
            title: "Error",
            description: imageData.error || "Error al subir imagen",
            variant: "destructive",
          });
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      // Actualizar datos del usuario
      const response = await fetch("/api/ajustes/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editingUser.id,
          nombre: formData.nombre,
          email: formData.email,
          rol_id: formData.rol_id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Miembro actualizado correctamente",
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setFormData({ nombre: "", email: "", rol_id: "" });
        setImagePreview(null);
        setImageFile(null);
        loadUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al actualizar miembro",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error editing user:", error);
      toast({
        title: "Error",
        description: "Error al actualizar miembro",
        variant: "destructive",
      });
      setUploadingImage(false);
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/ajustes/usuarios?id=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Miembro eliminado correctamente",
        });
        loadUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar miembro",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar miembro",
        variant: "destructive",
      });
    }
  };


  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id || "",
    });
    
    // Cargar imagen de perfil si existe
    if (user.imagen_usuario) {
      const imagenData = typeof user.imagen_usuario === 'string' 
        ? JSON.parse(user.imagen_usuario) 
        : user.imagen_usuario;
      if (imagenData?.url) {
        setImagePreview(imagenData.url);
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }
    
    setImageFile(null);
    setIsEditDialogOpen(true);
  };

  const getInitials = (nombre: string) => {
    if (!nombre) return "?";
    return nombre
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserImage = (user: User) => {
    if (user.imagen_usuario) {
      const imagenData = typeof user.imagen_usuario === 'string' 
        ? JSON.parse(user.imagen_usuario) 
        : user.imagen_usuario;
      return imagenData?.url || null;
    }
    return null;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 sm:max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Título */}
      <div>
        <h3 className="text-lg font-semibold">Miembros ({filteredUsers.length})</h3>
      </div>

      {/* Tabla de usuarios */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Nombre</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Rol</TableHead>
              <TableHead className="text-center">Fecha de Creación</TableHead>
              <TableHead className="text-center">Último Acceso</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando miembros...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No se encontraron miembros
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userImage = getUserImage(user);
                return (
                <TableRow key={user.id}>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userImage || undefined} alt={user.nombre} />
                        <AvatarFallback className="bg-[#D54644] text-white text-xs font-medium">
                          {getInitials(user.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{user.email}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{user.rol}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {new Date(user.fechaCreacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleDateString() : "Nunca"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        onClick={() => openEditDialog(user)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el miembro {user.nombre}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Miembro</DialogTitle>
            <DialogDescription>
              Modifica la información del miembro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Imagen de perfil */}
            <div>
              <Label>Imagen de Perfil</Label>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={imagePreview || undefined} alt={formData.nombre || "Miembro"} />
                  <AvatarFallback>{getInitials(formData.nombre || "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <label
                    htmlFor="edit-image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Cambiar imagen</span>
                  </label>
                  <input
                    id="edit-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imageFile && (
                    <Button
                      size="sm"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="mt-2 bg-[#D54644] hover:bg-[#B03A38]"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Guardar imagen"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-rol">Rol</Label>
              <Select value={formData.rol_id} onValueChange={(value) => setFormData({ ...formData, rol_id: value })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEditUser}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

