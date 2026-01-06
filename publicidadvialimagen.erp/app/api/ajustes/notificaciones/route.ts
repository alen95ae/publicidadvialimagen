export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { requirePermiso } from '@/lib/permisos';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

// Schema de validación para PATCH
const patchTipoActivaSchema = z.object({
  action: z.literal('update_tipo_activa'),
  notificacion_tipo_id: z.union([z.string().uuid(), z.string()]), // Aceptar UUID o string
  activa: z.boolean(),
});

const patchRolEnabledSchema = z.object({
  action: z.literal('update_rol_enabled'),
  notificacion_tipo_id: z.union([z.string().uuid(), z.string()]), // Aceptar UUID o string
  rol_id: z.union([z.string().uuid(), z.string()]), // Aceptar UUID o string
  enabled: z.boolean(),
});

const patchSchema = z.union([patchTipoActivaSchema, patchRolEnabledSchema]);

// NOTA: Las reglas de negocio ahora se gestionan completamente desde la base de datos
// a través de notificacion_roles.enabled. No hay validaciones hardcodeadas.

/**
 * GET - Obtener configuración de notificaciones
 * Retorna: tipos de notificación, roles, y mapa de notificacion_roles
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    const supabase = getSupabaseServer();

    // 1. Obtener todos los tipos de notificación
    const { data: tiposData, error: tiposError } = await supabase
      .from('notificacion_tipos')
      .select('*')
      .order('created_at', { ascending: true });

    if (tiposError) {
      console.error('❌ Error obteniendo tipos de notificación:', tiposError);
      return NextResponse.json(
        { error: 'Error al obtener tipos de notificación' },
        { status: 500 }
      );
    }

    // 2. Obtener todos los roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('id, nombre, descripcion')
      .order('nombre', { ascending: true });

    if (rolesError) {
      console.error('❌ Error obteniendo roles:', rolesError);
      return NextResponse.json(
        { error: 'Error al obtener roles' },
        { status: 500 }
      );
    }

    // 3. Obtener todas las relaciones notificacion_roles
    const { data: notificacionRolesData, error: notificacionRolesError } = await supabase
      .from('notificacion_roles')
      .select('notificacion_tipo_id, rol_id, enabled');

    if (notificacionRolesError) {
      console.error('❌ Error obteniendo notificacion_roles:', notificacionRolesError);
      return NextResponse.json(
        { error: 'Error al obtener configuración de roles' },
        { status: 500 }
      );
    }

    // 4. Crear mapa de enabled: { `${notificacion_tipo_id}_${rol_id}`: boolean }
    // Clave estándar: usar EXACTAMENTE notificacion_tipo_id y rol_id (UUIDs)
    const enabledMap: Record<string, boolean> = {};
    (notificacionRolesData || []).forEach((nr: any) => {
      // Clave estándar: `${notificacion_tipo_id}_${rol_id}`
      const key = `${nr.notificacion_tipo_id}_${nr.rol_id}`;
      enabledMap[key] = nr.enabled;
    });
    
    console.log('[GET /api/ajustes/notificaciones] enabledMap construido:', {
      totalEntries: Object.keys(enabledMap).length,
      sampleKeys: Object.keys(enabledMap).slice(0, 5),
    });

    return NextResponse.json({
      tipos: tiposData || [],
      roles: rolesData || [],
      enabledMap,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/ajustes/notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Actualizar configuración de notificaciones
 * Acciones:
 * - update_tipo_activa: actualizar activa de notificacion_tipos
 * - update_rol_enabled: actualizar enabled de notificacion_roles (UPSERT)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePermiso("ajustes", "admin");
    if (authResult instanceof NextResponse) return authResult;

    let body;
    try {
      body = await request.json();
      console.log('[PATCH] Body recibido:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[PATCH] Error parseando JSON:', parseError);
      return NextResponse.json(
        { error: 'Body inválido (no es JSON válido)', details: parseError instanceof Error ? parseError.message : String(parseError) },
        { status: 400 }
      );
    }
    
    // Validar payload con Zod
    const validationResult = patchSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[PATCH] Error de validación Zod:', {
        errors: validationResult.error.errors,
        body: body,
      });
      return NextResponse.json(
        { 
          error: 'Payload inválido', 
          details: validationResult.error.errors,
          received: body,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const data = validationResult.data;

    // Acción 1: Actualizar activa de un tipo
    if (data.action === 'update_tipo_activa') {
      const { notificacion_tipo_id, activa } = data;

      // Obtener el tipo para verificar reglas especiales
      const { data: tipoData, error: tipoError } = await supabase
        .from('notificacion_tipos')
        .select('codigo')
        .eq('id', notificacion_tipo_id)
        .single();

      if (tipoError || !tipoData) {
        return NextResponse.json(
          { error: 'Tipo de notificación no encontrado' },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabase
        .from('notificacion_tipos')
        .update({ activa })
        .eq('id', notificacion_tipo_id);

      if (updateError) {
        console.error('❌ Error actualizando activa:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar tipo de notificación' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Acción 2: Actualizar enabled de notificacion_roles (UPSERT)
    if (data.action === 'update_rol_enabled') {
      const { notificacion_tipo_id, rol_id, enabled } = data;

      // Verificar que el tipo existe
      const { data: tipoData, error: tipoError } = await supabase
        .from('notificacion_tipos')
        .select('id')
        .eq('id', notificacion_tipo_id)
        .single();

      if (tipoError || !tipoData) {
        return NextResponse.json(
          { error: 'Tipo de notificación no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el rol existe
      const { data: rolData, error: rolError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', rol_id)
        .single();

      if (rolError || !rolData) {
        return NextResponse.json(
          { error: 'Rol no encontrado' },
          { status: 404 }
        );
      }

      // UPSERT: verificar si existe
      const { data: existing, error: checkError } = await supabase
        .from('notificacion_roles')
        .select('enabled')
        .eq('notificacion_tipo_id', notificacion_tipo_id)
        .eq('rol_id', rol_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error verificando notificacion_roles:', checkError);
        return NextResponse.json(
          { error: 'Error al verificar configuración' },
          { status: 500 }
        );
      }

      if (existing) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('notificacion_roles')
          .update({ enabled })
          .eq('notificacion_tipo_id', notificacion_tipo_id)
          .eq('rol_id', rol_id);

        if (updateError) {
          console.error('❌ Error actualizando notificacion_roles:', updateError);
          return NextResponse.json(
            { error: 'Error al actualizar configuración' },
            { status: 500 }
          );
        }
        
        console.log('[PATCH] UPDATE exitoso:', {
          notificacion_tipo_id,
          rol_id,
          enabled,
          key: `${notificacion_tipo_id}_${rol_id}`,
        });
      } else {
        // INSERT
        const { error: insertError } = await supabase
          .from('notificacion_roles')
          .insert({
            notificacion_tipo_id,
            rol_id,
            enabled,
          });

        if (insertError) {
          console.error('❌ Error insertando notificacion_roles:', insertError);
          return NextResponse.json(
            { error: 'Error al crear configuración' },
            { status: 500 }
          );
        }
        
        console.log('[PATCH] INSERT exitoso:', {
          notificacion_tipo_id,
          rol_id,
          enabled,
          key: `${notificacion_tipo_id}_${rol_id}`,
        });
      }

      return NextResponse.json({ 
        success: true,
        notificacion_tipo_id,
        rol_id,
        enabled,
        key: `${notificacion_tipo_id}_${rol_id}`,
      });
    }

    return NextResponse.json(
      { error: 'Acción no reconocida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error en PATCH /api/ajustes/notificaciones:', error);
    
    // Si es un error de Zod, devolver detalles
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Error de validación', 
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

