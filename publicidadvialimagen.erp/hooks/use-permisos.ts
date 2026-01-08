"use client";

import { useState, useEffect } from "react";
import { normalizarModulo, normalizarAccion } from "@/lib/permisos-utils";

export interface PermisosMatrix {
  [modulo: string]: {
    ver?: boolean;
    editar?: boolean;
    eliminar?: boolean;
    admin?: boolean;
    [accion: string]: boolean | undefined; // Permite acciones personalizadas (permisos técnicos)
  };
}

export function usePermisos() {
  const [permisos, setPermisos] = useState<PermisosMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermisos();
  }, []);

  const loadPermisos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/permisos", {
        credentials: "include",
        cache: "no-store",
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error("Error al cargar permisos");
      }

      const data = await response.json();
      setPermisos(data.permisos || {});
    } catch (err) {
      console.error("Error loading permisos:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPermisos({});
    } finally {
      setLoading(false);
    }
  };

  // Helper para verificar un permiso específico
  const tienePermiso = (modulo: string, accion: string): boolean => {
    const moduloNormalizado = normalizarModulo(modulo);
    const accionNormalizada = normalizarAccion(accion);
    
    const moduloPermisos = permisos[moduloNormalizado];
    if (!moduloPermisos) return false;

    // Si tiene admin (solo para módulos no técnicos), tiene acceso según el módulo
    // EXCEPCIÓN: Para "ajustes", editar y eliminar NO se otorgan automáticamente
    if (moduloNormalizado !== 'tecnico' && moduloPermisos.admin) {
      if (moduloNormalizado === 'ajustes') {
        // Para ajustes: admin solo da acceso a ver y admin, editar/eliminar deben estar explícitamente asignados
        if (accionNormalizada === 'ver' || accionNormalizada === 'admin') {
          return true;
        }
      } else {
        // Para otros módulos: admin da acceso a ver, editar, eliminar, admin (comportamiento estándar)
        if (accionNormalizada === 'ver' || accionNormalizada === 'editar' || accionNormalizada === 'eliminar' || accionNormalizada === 'admin') {
          return true;
        }
      }
    }

    // Buscar la clave normalizada en el objeto
    // También buscar variaciones por si acaso
    const todasLasClaves = Object.keys(moduloPermisos);
    const claveExacta = todasLasClaves.find(k => normalizarAccion(k) === accionNormalizada);
    
    if (claveExacta) {
      return (moduloPermisos as Record<string, boolean | undefined>)[claveExacta] || false;
    }

    // Fallback: intentar con la acción normalizada directamente
    return (moduloPermisos as Record<string, boolean | undefined>)[accionNormalizada] || false;
  };

  // Helper para verificar si puede ver el módulo
  const puedeVer = (modulo: string): boolean => {
    return tienePermiso(modulo, "ver") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si puede editar
  const puedeEditar = (modulo: string): boolean => {
    return tienePermiso(modulo, "editar") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si puede eliminar
  const puedeEliminar = (modulo: string): boolean => {
    return tienePermiso(modulo, "eliminar") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si es admin del módulo
  const esAdmin = (modulo: string): boolean => {
    return tienePermiso(modulo, "admin");
  };

  // Helper para verificar funciones técnicas
  const tieneFuncionTecnica = (accion: string): boolean => {
    // No verificar si aún está cargando
    if (loading) {
      if (accion === 'ver historial soportes' || accion === 'modificar precio cotización') {
        console.log('⏳ [usePermisos] Aún cargando permisos, retornando false');
      }
      return false;
    }
    
    // SOLUCIÓN DEFINITIVA: Usar la misma normalización que el backend
    // Esto elimina tildes, convierte a minúsculas y colapsa espacios
    const accionNormalizada = normalizarAccion(accion);
    
    const permisosTecnico = permisos["tecnico"];
    if (!permisosTecnico) {
      if (accion === 'ver historial soportes' || accion === 'modificar precio cotización') {
        console.warn('⚠️ [usePermisos] No hay módulo técnico en permisos');
      }
      return false;
    }
    
    // Buscar directamente con la clave normalizada
    // El backend ya normalizó las claves, así que coincidirán
    const valor = permisosTecnico[accionNormalizada];
    const resultado = valor === true;
    
    // Log específico para permisos técnicos importantes - SIEMPRE mostrar
    if (accion === 'ver dueño de casa' || accion === 'ver historial soportes' || accion === 'modificar precio cotización') {
      console.log(`🔍 [usePermisos] Verificando "${accion}":`, {
        accion,
        accionNormalizada,
        resultado,
        valorEnPermisos: valor,
        tipoValor: typeof valor,
        todasLasClaves: Object.keys(permisosTecnico || {}),
        permisosTecnico: permisosTecnico
      });
    }
    
    return resultado;
  };

  return {
    permisos,
    loading,
    error,
    tienePermiso,
    puedeVer,
    puedeEditar,
    puedeEliminar,
    esAdmin,
    tieneFuncionTecnica,
    refresh: loadPermisos,
  };
}

