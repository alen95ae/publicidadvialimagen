"use client";

import { useState, useEffect } from "react";

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

  // Función para normalizar acciones (elimina espacios extra, mantiene acentos)
  const normalizarAccion = (accion: string): string => {
    if (!accion) return '';
    return accion
      .trim()                 // elimina espacios al inicio/final
      .replace(/\s+/g, " ");  // colapsa espacios múltiples a uno solo
  };

  // Helper para verificar un permiso específico
  const tienePermiso = (modulo: string, accion: string): boolean => {
    // Normalizar módulo y acción para coincidir con las claves del backend
    const moduloNormalizado = modulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    
    const accionNormalizada = normalizarAccion(accion);
    
    const moduloPermisos = permisos[moduloNormalizado];
    if (!moduloPermisos) return false;

    // Si tiene admin (solo para módulos no técnicos), tiene todos los permisos estándar
    if (moduloNormalizado !== 'tecnico' && moduloPermisos.admin) {
      // Para módulos normales, admin da acceso a ver, editar, eliminar
      if (accionNormalizada === 'ver' || accionNormalizada === 'editar' || accionNormalizada === 'eliminar' || accionNormalizada === 'admin') {
        return true;
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
    if (loading) return false;
    
    // Normalizar acción para coincidir con la clave del backend
    const accionNormalizada = accion
      .trim()
      .replace(/\s+/g, " ");
    
    // SOLUCIÓN QUIRÚRGICA: Buscar la clave exacta o variaciones
    const permisosTecnico = permisos["tecnico"];
    if (!permisosTecnico) return false;
    
    // Intentar con la clave exacta primero
    let valor = permisosTecnico[accionNormalizada];
    
    // Si no se encuentra, buscar en todas las claves con normalización
    if (valor === undefined) {
      const todasLasClaves = Object.keys(permisosTecnico);
      const claveEncontrada = todasLasClaves.find(k => {
        const kNormalizada = k.trim().replace(/\s+/g, " ");
        return kNormalizada === accionNormalizada;
      });
      if (claveEncontrada) {
        valor = permisosTecnico[claveEncontrada];
      }
    }
    
    // Verificar explícitamente que sea true (no truthy)
    const resultado = valor === true;
    
    // Log específico para "ver dueño de casa"
    if (accion === 'ver dueño de casa') {
      console.log('🔍 [usePermisos] Verificando "ver dueño de casa":', {
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

