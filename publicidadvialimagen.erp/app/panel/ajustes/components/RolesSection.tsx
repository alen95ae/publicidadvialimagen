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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Edit, Trash2, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermisosContext } from "@/hooks/permisos-provider";

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
  const { puedeEditar, puedeEliminar, esAdmin, tienePermiso, permisos: permisosContext } = usePermisosContext();
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

  // Función para obtener la descripción detallada del permiso según módulo y acción
  const getPermissionDescription = (modulo: string, accion: string): string => {
    const moduloNormalizado = normalizarModulo(modulo);
    
    // Descripciones genéricas base
    const descripcionesBase: Record<string, string> = {
      ver: "Permite visualizar y acceder al módulo. Incluye ver listados, detalles de ítems y navegar por las secciones del módulo.",
      editar: "Permite modificar ítems existentes. Incluye edición desde la página de editar ítem, edición masiva en listados y modificación de campos en el propio listado.",
      eliminar: "Permite eliminar ítems del módulo. Incluye eliminación individual y eliminación masiva cuando está disponible.",
      admin: "Permite acceso completo al módulo. Incluye todas las funciones de ver, editar y eliminar, además de funciones administrativas específicas del módulo."
    };

    // Descripciones específicas por módulo para "admin"
    const descripcionesAdmin: Record<string, string> = {
      ventas: "Acceso completo al módulo de Ventas.\n\nPestañas disponibles:\n• Cotizaciones\n• Pipeline\n• Solicitudes de cotización\n\nFunciones especiales:\n• Aprobar/Rechazar cotizaciones\n• Cambiar vendedor en cualquier cotización\n• Gestionar pipelines completos (crear, editar, eliminar)\n• Gestionar etapas del pipeline\n• Editar cualquier cotización sin restricciones\n\nBotones adicionales:\n• Crear nueva cotización\n• Editar cotizaciones de otros vendedores\n• Eliminar cotizaciones\n• Gestionar oportunidades en pipeline\n\nNota: Exportar e Importar se controlan mediante funciones técnicas, no mediante este permiso.",
      soportes: "Acceso completo al módulo de Soportes.\n\nPestañas disponibles:\n• Gestión de soportes\n• Alquileres\n• Planificación\n• Costes\n• Mantenimiento\n• Informes\n\nFunciones especiales:\n• Reservar/liberar soportes\n• Cambiar estados de soportes\n• Gestionar costes y propietarios\n• Ver historial completo de soportes\n• Modificar alquileres sin restricciones\n• Gestionar mantenimientos\n• Editar soportes (todos los campos)\n• Eliminar alquileres y soportes\n• Gestionar reservas temporales\n\nBotones adicionales:\n• Editar soportes (todos los campos)\n• Eliminar alquileres y soportes\n• Gestionar reservas temporales\n\nNota: Las funciones técnicas se controlan individualmente, no mediante este permiso. Exportar e Importar se controlan mediante funciones técnicas, no mediante este permiso.",
      inventario: "Acceso completo al módulo de Inventario.\n\nPestañas disponibles:\n• Productos\n• Recursos\n• Control de Stock\n\nFunciones especiales:\n• Ajustar stock manualmente\n• Gestionar variantes de productos\n• Modificar precios y costes\n• Ver movimientos completos de stock\n• Gestionar categorías y recursos\n• Exportar datos completos\n\nBotones adicionales:\n• Crear/editar/eliminar productos\n• Gestionar recursos completos\n• Ajustes masivos de stock",
      contabilidad: "Acceso completo al módulo de Contabilidad.\n\nPestañas disponibles:\n• Plan de Cuentas\n• Auxiliares\n• Comprobantes\n• Presupuestos\n• Empresas\n• Informes\n\nFunciones especiales:\n• Aprobar comprobantes\n• Generar informes completos (PDF, Excel)\n• Modificar estructuras contables\n• Gestionar empresas\n• Editar plantillas contables\n• Reordenar estructuras\n\nBotones adicionales:\n• Crear/editar/eliminar comprobantes\n• Gestionar auxiliares completos\n• Aplicar plantillas a comprobantes",
      ajustes: "Acceso completo al módulo de Ajustes.\n\nPestañas disponibles:\n• Usuarios\n• Roles y Permisos\n• Invitaciones\n• Notificaciones\n\nFunciones especiales:\n• Crear/editar/eliminar usuarios\n• Gestionar roles completos (crear, editar, eliminar)\n• Configurar sistema de notificaciones\n• Gestionar invitaciones\n• Asignar roles a usuarios\n• Exportar datos de usuarios\n\nBotones adicionales:\n• Crear nuevo rol\n• Editar cualquier rol\n• Eliminar roles\n• Gestionar permisos de roles",
      contactos: "Acceso completo al módulo de Contactos.\n\nPestañas disponibles:\n• Contactos\n• Leads (requiere admin)\n• Miembros (requiere admin)\n\nFunciones especiales:\n• Convertir leads a contactos\n• Gestionar miembros completos\n• Edición masiva completa\n• Gestionar papelera de leads\n• Restaurar leads eliminados\n• Detectar duplicados\n\nBotones adicionales:\n• Crear/editar/eliminar contactos\n• Matar/restaurar leads\n• Edición masiva de contactos y leads\n• Acceso a pestañas Leads y Miembros (solo admin)\n\nNota: Exportar e Importar se controlan mediante funciones técnicas, no mediante este permiso.",
      mensajes: "Acceso completo al módulo de Mensajes.\n\nPestañas disponibles:\n• Mensajes\n• Formularios (requiere admin)\n• Notificaciones\n\nFunciones especiales:\n• Marcar como leído/no leído\n• Responder mensajes\n• Gestionar estados masivamente\n• Ver todos los mensajes sin restricciones\n• Eliminar formularios\n\nBotones adicionales:\n• Eliminar mensajes y formularios\n• Gestión masiva de estados\n\nNota: Las notificaciones siempre se pueden eliminar. Exportar e Importar se controlan mediante funciones técnicas, no mediante este permiso.",
      metricas: "Acceso completo al módulo de Métricas.\n\nFunciones especiales:\n• Ver todas las métricas y análisis\n• Exportar reportes completos\n• Configurar dashboards\n• Ver métricas avanzadas\n• Acceso a todos los gráficos y visualizaciones\n\nBotones adicionales:\n• Exportar datos\n• Personalizar vistas\n• Generar reportes personalizados"
    };

    // Descripciones específicas por módulo para "editar"
    const descripcionesEditar: Record<string, string> = {
      ventas: "Permite editar cotizaciones, oportunidades y solicitudes.\n\nIncluye:\n• Edición desde página de editar ítem (cambiar datos, líneas, precios)\n• Edición masiva en listados\n• Modificar oportunidades en pipeline\n• Cambiar vendedor en cotizaciones propias\n• Editar solicitudes de cotización",
      soportes: "Permite editar soportes, alquileres y planificación.\n\nSi está deseleccionado, NO podrá:\n• Edición desde página de editar ítem (cambiar datos, ubicación, estado)\n• Edición masiva en listados\n• Modificar alquileres\n• Actualizar planificación\n• Ajustar costes\n• Reserva temporal de soportes",
      inventario: "Permite editar productos, recursos y stock.\n\nIncluye:\n• Edición desde página de editar ítem (cambiar precios, descripciones, stock)\n• Edición masiva en listados\n• Modificar variantes de productos\n• Actualizar control de stock\n• Ajustar cantidades",
      contabilidad: "Permite editar comprobantes, auxiliares y presupuestos.\n\nIncluye:\n• Edición desde página de editar ítem\n• Edición masiva en listados\n• Modificar auxiliares\n• Actualizar presupuestos\n• Editar empresas\n• Modificar estructuras contables",
      ajustes: "Permite editar usuarios y roles existentes.\n\nIncluye:\n• Edición desde página de editar ítem (cambiar roles, datos)\n• Modificar roles existentes\n• Actualizar invitaciones\n• Cambiar datos de usuarios\n\nSi está deseleccionado, NO aparecerán:\n• Botón \"Editar Usuario\" en el listado de usuarios\n• Botón \"Editar Rol\" en el listado de roles\n\nNo incluye crear/eliminar (requiere admin).",
      contactos: "Permite editar contactos, leads y miembros.\n\nIncluye:\n• Edición desde página de editar ítem (cambiar datos, estados)\n• Edición masiva en listados\n• Modificar miembros\n• Conversión de leads a contactos\n• Actualizar información de contacto\n\nNota: No incluye acceso a pestañas Leads y Miembros (requiere admin).",
      mensajes: "Permite editar estados de mensajes y formularios.\n\nIncluye:\n• Marcar como leído/no leído\n• Modificar formularios\n• Gestión de estados masiva\n• Actualizar estados de notificaciones"
    };

    // Descripciones específicas por módulo para "eliminar"
    const descripcionesEliminar: Record<string, string> = {
      ventas: "Permite eliminar cotizaciones, oportunidades y solicitudes.\n\nIncluye:\n• Eliminación individual desde listado o página de detalle\n• Eliminación masiva cuando está disponible\n• Eliminar etapas del pipeline\n• Eliminar solicitudes de cotización",
      soportes: "Permite eliminar alquileres, registros de mantenimiento y soportes.\n\nIncluye:\n• Eliminación individual de alquileres\n• Eliminación masiva cuando está disponible\n• Eliminar registros de mantenimiento\n• Eliminar soportes",
      inventario: "Permite eliminar productos, recursos y registros de stock.\n\nIncluye:\n• Eliminación individual desde listado o página de detalle\n• Eliminación masiva cuando está disponible\n• Eliminar variantes de productos\n• Eliminar recursos",
      contabilidad: "Permite eliminar comprobantes, auxiliares y presupuestos.\n\nIncluye:\n• Eliminación individual\n• Eliminación masiva cuando está disponible\n\nNota: Requiere validación según políticas contables.",
      ajustes: "Permite eliminar usuarios, roles e invitaciones.\n\nIncluye:\n• Eliminación individual\n• Eliminación masiva cuando está disponible\n\nSi está deseleccionado, NO aparecerán:\n• Botón \"Eliminar\" en invitaciones\n• Botón \"Eliminar Rol\" en el listado de roles\n• Botón \"Eliminar Usuario\" en el listado de usuarios\n\nNota: Acción crítica que requiere confirmación.",
      contactos: "Permite eliminar contactos, leads y miembros.\n\nIncluye:\n• Eliminación individual\n• Eliminación masiva\n• Papelera de leads (soft delete)\n• Eliminación permanente de leads",
      mensajes: "Permite eliminar mensajes y formularios.\n\nIncluye:\n• Eliminación individual\n• Eliminación masiva cuando está disponible\n• Eliminar formularios recibidos\n\nSi está deseleccionado, NO aparecerán:\n• Botón \"Eliminar\" individual en formularios\n• Botón \"Eliminar\" masivo en formularios\n\nNota: Las notificaciones siempre se pueden eliminar, independientemente de este permiso."
    };

    // Descripciones específicas por módulo para "ver"
    const descripcionesVer: Record<string, string> = {
      ventas: "Permite visualizar y acceder al módulo de Ventas.\n\nIncluye:\n• Ver listados de cotizaciones, pipeline y solicitudes\n• Ver detalles de ítems individuales\n• Navegar por todas las pestañas del módulo\n• Ver información de cotizaciones y oportunidades\n• Acceso de solo lectura a todos los datos",
      soportes: "Permite visualizar y acceder al módulo de Soportes.\n\nIncluye:\n• Ver listados de soportes, alquileres, planificación\n• Ver detalles de soportes y alquileres\n• Acceso a todas las secciones: Gestión, Alquileres, Planificación\n• Acceso de solo lectura a todos los datos",
      inventario: "Permite visualizar y acceder al módulo de Inventario.\n\nIncluye:\n• Ver listados de productos y recursos\n• Ver detalles de productos y recursos\n• Ver control de stock\n• Acceso a todas las pestañas del módulo\n• Ver información de precios, stock y variantes\n• Acceso de solo lectura a todos los datos",
      contabilidad: "Permite visualizar y acceder al módulo de Contabilidad.\n\nIncluye:\n• Ver plan de cuentas, auxiliares, comprobantes\n• Ver detalles de comprobantes y presupuestos\n• Acceso a todas las pestañas: Plan de Cuentas, Auxiliares, Comprobantes, Presupuestos, Empresas, Informes\n• Ver informes y reportes\n• Acceso de solo lectura a todos los datos",
      ajustes: "Permite visualizar y acceder al módulo de Ajustes.\n\nIncluye:\n• Ver listados de usuarios, roles, invitaciones\n• Ver detalles de usuarios y roles\n• Acceso a todas las secciones: Usuarios, Roles y Permisos, Invitaciones, Notificaciones\n• Ver configuración del sistema\n• Acceso de solo lectura a todos los datos",
      contactos: "Permite visualizar y acceder al módulo de Contactos.\n\nIncluye:\n• Ver listados de contactos\n• Ver detalles de contactos\n• Acceso a la pestaña principal: Contactos\n• Ver información completa de contactos\n• Acceso de solo lectura a datos de contactos\n\nNota: No incluye acceso a pestañas Leads y Miembros (requieren admin).",
      mensajes: "Permite visualizar y acceder al módulo de Mensajes.\n\nIncluye:\n• Ver listados de mensajes y formularios\n• Ver detalles de mensajes y formularios\n• Acceso a todas las secciones del módulo\n• Ver notificaciones\n• Acceso de solo lectura a todos los datos"
    };

    if (accion === "admin") {
      return descripcionesAdmin[moduloNormalizado] || descripcionesBase.admin;
    } else if (accion === "editar") {
      return descripcionesEditar[moduloNormalizado] || descripcionesBase.editar;
    } else if (accion === "eliminar") {
      return descripcionesEliminar[moduloNormalizado] || descripcionesBase.eliminar;
    } else if (accion === "ver") {
      return descripcionesVer[moduloNormalizado] || descripcionesBase.ver;
    }
    
    return descripcionesBase[accion] || "Permiso estándar del módulo.";
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

  // Obtener módulos únicos ordenados (excluyendo módulos que no existen)
  const modulosExcluidos = ['diseño_grafico', 'diseño gráfico', 'diseñografico', 'diseno_grafico', 'diseno gráfico', 'diseñografico', 'empleados', 'empleado', 'sitio_web', 'sitio web'];
  const modulos = Object.keys(permisosPorModulo)
    .filter(modulo => {
      const moduloLower = modulo.toLowerCase().trim();
      return !modulosExcluidos.some(excluido => excluido.toLowerCase().trim() === moduloLower);
    })
    .sort();

  // Función para cambiar estado de permiso técnico
  const handlePermisoTecnicoChange = (id: string, checked: boolean) => {
    setPermisosTecnicos(prev => 
      prev.map(pt => pt.id === id ? { ...pt, asignado: checked } : pt)
    );
  };

  // Función para ordenar permisos técnicos: "descargar ot" -> resto
  const ordenarPermisosTecnicos = (permisos: Array<{ id: string; accion: string; asignado: boolean }>) => {
    return [...permisos].sort((a, b) => {
      const accionA = a.accion.toLowerCase();
      const accionB = b.accion.toLowerCase();
      
      // Función auxiliar para obtener el orden de prioridad
      const getOrder = (accion: string): number => {
        if (accion === "descargar ot") return 0;
        return 1; // Resto de permisos
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
        {permisosContext.ajustes?.editar === true && (
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
                              <Label htmlFor={`create-${permiso.id}`} className="text-sm flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted cursor-help text-black hover:text-gray-800">
                                  {getPermissionLabel(permiso.accion)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white">
                                    <p className="text-sm whitespace-pre-line">
                                      {getPermissionDescription(modulo, permiso.accion)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
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
        )}
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
                    {permisosContext.ajustes?.editar === true && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    )}
                    {permisosContext.ajustes?.eliminar === true && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          title="Eliminar"
                          className="text-red-600 hover:bg-red-50 hover:text-red-600"
                        >
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
                              <Label htmlFor={`edit-${permiso.id}`} className="text-sm flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted cursor-help text-black hover:text-gray-800">
                                {getPermissionLabel(permiso.accion)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white">
                                    <p className="text-sm whitespace-pre-line">
                                      {getPermissionDescription(modulo, permiso.accion)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
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
