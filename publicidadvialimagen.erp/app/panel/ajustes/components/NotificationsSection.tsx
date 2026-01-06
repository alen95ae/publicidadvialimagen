"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Search, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificacionTipo {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  entidad_tipo: string;
  tipo_default: string;
  prioridad_default: string;
  activa: boolean;
  origen: 'evento' | 'cron';
  created_at: string;
}

interface Role {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface NotificacionesData {
  tipos: NotificacionTipo[];
  roles: Role[];
  enabledMap: Record<string, boolean>; // `${tipoId}_${rolId}`: boolean
}

// NOTA: Las reglas de negocio ahora se gestionan completamente desde la base de datos
// No hay validaciones hardcodeadas en el frontend

export default function NotificationsSection() {
  const [data, setData] = useState<NotificacionesData>({
    tipos: [],
    roles: [],
    enabledMap: {},
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [soloActivas, setSoloActivas] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ajustes/notificaciones", {
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar configuración de notificaciones",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar configuración de notificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar roles: excluir "invitado" y "diseño"
  const rolesFiltrados = useMemo(() => {
    return (data.roles || []).filter(
      (rol) => 
        rol.nombre.toLowerCase() !== 'invitado' && 
        rol.nombre.toLowerCase() !== 'diseño'
    );
  }, [data.roles]);

  // Filtrar tipos según búsqueda y filtro de activas
  const tiposFiltrados = useMemo(() => {
    return data.tipos.filter((tipo) => {
      const matchSearch =
        tipo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchActivas = soloActivas ? tipo.activa : true;
      return matchSearch && matchActivas;
    });
  }, [data.tipos, searchTerm, soloActivas]);

  // NOTA: Ya no hay validaciones hardcodeadas. Todos los toggles son editables.
  // Las reglas de negocio se gestionan desde la base de datos.

  // Obtener el estado enabled de un tipo+rol
  // Clave estándar: `${notificacion_tipo_id}_${rol_id}`
  const getEnabled = (tipoId: string, rolId: string): boolean => {
    const key = `${tipoId}_${rolId}`;
    const value = data.enabledMap[key] ?? false;
    return value;
  };

  // Actualizar activa de un tipo
  const handleToggleActiva = async (tipoId: string, currentActiva: boolean) => {
    const newActiva = !currentActiva;
    
    // Optimistic update
    setData((prev) => ({
      ...prev,
      tipos: prev.tipos.map((t) =>
        t.id === tipoId ? { ...t, activa: newActiva } : t
      ),
    }));

    try {
      const response = await fetch("/api/ajustes/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_tipo_activa",
          notificacion_tipo_id: tipoId,
          activa: newActiva,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Tipo de notificación ${newActiva ? "activado" : "desactivado"}`,
        });
      } else {
        // Rollback
        setData((prev) => ({
          ...prev,
          tipos: prev.tipos.map((t) =>
            t.id === tipoId ? { ...t, activa: currentActiva } : t
          ),
        }));
        toast({
          title: "Error",
          description: result.error || "Error al actualizar tipo de notificación",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Rollback
      setData((prev) => ({
        ...prev,
        tipos: prev.tipos.map((t) =>
          t.id === tipoId ? { ...t, activa: currentActiva } : t
        ),
      }));
      toast({
        title: "Error",
        description: "Error al actualizar tipo de notificación",
        variant: "destructive",
      });
    }
  };

  // Actualizar enabled de un rol para un tipo
  const handleToggleRol = async (tipoId: string, rolId: string) => {
    // Clave estándar: `${notificacion_tipo_id}_${rol_id}`
    const updateKey = `${tipoId}_${rolId}`;
    const currentEnabled = getEnabled(tipoId, rolId);
    const newEnabled = !currentEnabled;

    console.log('[TOGGLE] Iniciando cambio:', {
      tipoId,
      rolId,
      updateKey,
      currentEnabled,
      newEnabled,
    });

    // Optimistic update
    setUpdating((prev) => new Set(prev).add(updateKey));
    setData((prev) => ({
      ...prev,
      enabledMap: {
        ...prev.enabledMap,
        [updateKey]: newEnabled,
      },
    }));

    try {
      // Payload exacto: asegurar que tipoId y rolId son strings
      const payload = {
        action: "update_rol_enabled",
        notificacion_tipo_id: String(tipoId),
        rol_id: String(rolId),
        enabled: Boolean(newEnabled),
      };
      
      console.log('[TOGGLE] Enviando PATCH:', payload);
      
      const response = await fetch("/api/ajustes/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('[TOGGLE] Error parseando respuesta JSON:', jsonError);
        const text = await response.text();
        console.error('[TOGGLE] Respuesta del servidor (texto):', text);
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        console.log('[TOGGLE] PATCH exitoso, refetching data...', result);
        
        // Refetch para sincronizar con la fuente de verdad
        await loadData();
        
        toast({
          title: "Éxito",
          description: `Configuración actualizada correctamente`,
        });
      } else {
        console.error('[TOGGLE] PATCH falló:', {
          status: response.status,
          statusText: response.statusText,
          result: result,
        });
        // Rollback
        setData((prev) => ({
          ...prev,
          enabledMap: {
            ...prev.enabledMap,
            [updateKey]: currentEnabled,
          },
        }));
        toast({
          title: "Error",
          description: result.error || "Error al actualizar configuración",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[TOGGLE] Error en PATCH:', error);
      // Rollback
      setData((prev) => ({
        ...prev,
        enabledMap: {
          ...prev.enabledMap,
          [updateKey]: currentEnabled,
        },
      }));
      toast({
        title: "Error",
        description: "Error al actualizar configuración",
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(updateKey);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por título o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="solo-activas"
            checked={soloActivas}
            onChange={(e) => setSoloActivas(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="solo-activas" className="text-sm text-gray-600 cursor-pointer">
            Solo activas
          </Label>
        </div>
      </div>

      {/* Tabla de configuración */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">
                  Tipo de Notificación
                </TableHead>
                <TableHead className="text-center min-w-[100px]">Activa</TableHead>
                {rolesFiltrados.map((rol) => (
                  <TableHead key={rol.id} className="text-center min-w-[120px]">
                    {rol.nombre}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={rolesFiltrados.length + 2} className="text-center text-gray-500 py-8">
                    No se encontraron tipos de notificación
                  </TableCell>
                </TableRow>
              ) : (
                tiposFiltrados.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div className="space-y-1">
                        <div className="font-medium">{tipo.titulo}</div>
                        <div className="text-xs text-gray-500">{tipo.codigo}</div>
                        {tipo.descripcion && (
                          <div className="text-xs text-gray-400">{tipo.descripcion}</div>
                        )}
                        {tipo.origen === 'cron' && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Procesado por cron
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={tipo.activa}
                        onCheckedChange={() => handleToggleActiva(tipo.id, tipo.activa)}
                        className="data-[state=checked]:bg-[#D54644]"
                      />
                    </TableCell>
                    {rolesFiltrados.map((rol) => {
                      const enabled = getEnabled(tipo.id, rol.id);
                      const isUpdating = updating.has(`${tipo.id}_${rol.id}`);

                      return (
                        <TableCell key={rol.id} className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={enabled}
                              disabled={isUpdating}
                              onCheckedChange={() => handleToggleRol(tipo.id, rol.id)}
                              className="data-[state=checked]:bg-[#D54644]"
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Info sobre tipos procesados por cron */}
      {tiposFiltrados.some((t) => t.origen === 'cron') && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tipos procesados por cron:</p>
                <p>
                  Los tipos marcados como "Procesado por cron" son evaluados automáticamente
                  por el sistema. Configura qué roles deben recibirlos usando los toggles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

