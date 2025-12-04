import { supabaseServer } from "@/lib/supabaseServer";
import {
  buildVariantDefinitionFromReceta,
  computeVariantCost,
  buildVariantKey
} from "./variantEngine";

import { generarCombinacionesVariantes } from "./generarCombinaciones";

/**
 * Sincronización estable y moderna de variantes de producto
 * 100% compatible con sistema corregido de variantes.
 */
export async function syncProductVariants(productId: string) {
  console.log(`🔄 [SYNC] Sincronizando variantes para producto ${productId}`);

  // 1. Cargar producto
  const { data: producto, error: prodError } = await supabaseServer
    .from("productos")
    .select("*")
    .eq("id", productId)
    .single();

  if (prodError || !producto) {
    throw new Error(`Producto no encontrado: ${prodError?.message}`);
  }

  // 2. Cargar receta
  let receta = producto.receta || [];
  if (typeof receta === "object" && !Array.isArray(receta)) {
    receta = receta.items || [];
  }
  if (!Array.isArray(receta)) receta = [];

  if (receta.length === 0) {
    console.log("⚠️ Producto sin receta → Eliminando variantes");
    await supabaseServer.from("producto_variantes").delete().eq("producto_id", productId);
    await supabaseServer.from("productos").update({ variante: [] }).eq("id", productId);
    return;
  }

  // 3. Cargar recursos usados en la receta
  const recursoIds = receta.map(r => r.recurso_id).filter(Boolean);
  const { data: recursos, error: recErr } = await supabaseServer
    .from("recursos")
    .select("*")
    .in("id", recursoIds);

  if (recErr || !recursos) {
    throw new Error(`Error cargando recursos: ${recErr?.message}`);
  }

  // Normalizar recursos: parsear variantes desde JSONB
  const recursosNormalizados = recursos.map(r => {
    // Normalizar variantes del recurso
    let variantesNormalizadas: any[] = []
    
    if (Array.isArray(r.variantes)) {
      variantesNormalizadas = r.variantes
    } else if (typeof r.variantes === 'string') {
      try {
        const parsed = JSON.parse(r.variantes)
        if (Array.isArray(parsed)) {
          variantesNormalizadas = parsed
        } else if (parsed && Array.isArray(parsed.variantes)) {
          variantesNormalizadas = parsed.variantes
        }
      } catch (e) {
        console.warn(`⚠️ Error parseando variantes del recurso ${r.id}:`, e)
      }
    } else if (r.variantes && typeof r.variantes === 'object' && Array.isArray(r.variantes.variantes)) {
      variantesNormalizadas = r.variantes.variantes
    }

    // Normalizar cada variante: aceptar tanto valores como posibilidades
    const variantesConValores = variantesNormalizadas.map((v: any) => {
      const valores = Array.isArray(v.valores) 
        ? v.valores 
        : Array.isArray(v.posibilidades)
        ? v.posibilidades
        : []
      
      return {
        ...v,
        nombre: v.nombre?.trim() || '',
        valores,
        posibilidades: valores // Mantener compatibilidad
      }
    }).filter((v: any) => v.nombre && v.valores.length > 0)

    return {
      ...r,
      variantes: variantesConValores
    }
  })

  // Crear un Map id → recurso normalizado
  const recursosMap = new Map(recursosNormalizados.map(r => [r.id, r]));

  // 4. Obtener definición de variantes basada en RECURSOS reales
  const definiciones = buildVariantDefinitionFromReceta(receta, recursosMap);

  console.log(`📋 [SYNC] Definiciones extraídas:`, JSON.stringify(definiciones, null, 2));

  // Guardar definiciones en producto.variante
  const definicionesJSON = definiciones.map(d => ({
    nombre: d.nombre,
    valores: d.valores
  }));
  
  console.log(`💾 [SYNC] Guardando variantes en producto:`, JSON.stringify(definicionesJSON, null, 2));

  await supabaseServer
    .from("productos")
    .update({ variante: definicionesJSON })
    .eq("id", productId);

  // 5. Generar TODAS las combinaciones posibles (producto cartesiano)
  const combinaciones = generarCombinacionesVariantes(definiciones);

  // Convertir a clave universal
  const combinacionesFinal = combinaciones.map(c => ({
    combinacion: buildVariantKey(c.valores),
    valores: c.valores
  }));

  // 6. Cargar variantes existentes
  const { data: existentes } = await supabaseServer
    .from("producto_variantes")
    .select("*")
    .eq("producto_id", productId);

  const existentesMap = new Map(
    (existentes || []).map(v => [v.combinacion, v])
  );

  // 7. Procesar sincronización
  const processedKeys = new Set<string>();
  const ops: any[] = [];

  for (const combo of combinacionesFinal) {
    const key = combo.combinacion;
    const valores = combo.valores;

    processedKeys.add(key);

    const coste = computeVariantCost(receta, recursos, valores);

    const precio = coste; // Temporal hasta que activemos calculadora final

    const existente = existentesMap.get(key);

    if (existente) {
      // UPDATE
      ops.push(
        supabaseServer
          .from("producto_variantes")
          .update({
            coste_calculado: coste,
            precio_calculado: precio,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq("id", existente.id)
      );
    } else {
      // INSERT
      ops.push(
        supabaseServer.from("producto_variantes").insert({
          producto_id: productId,
          combinacion: key,
          valores,
          coste_calculado: coste,
          precio_calculado: precio,
          coste_override: null,
          precio_override: null
        })
      );
    }
  }

  // 8. Eliminar variantes obsoletas (solo las que YA NO EXISTEN)
  const obsoletas =
    existentes?.filter(v => !processedKeys.has(v.combinacion)) || [];

  if (obsoletas.length > 0) {
    ops.push(
      supabaseServer
        .from("producto_variantes")
        .delete()
        .in(
          "id",
          obsoletas.map(v => v.id)
        )
    );
  }

  await Promise.all(ops);

  console.log(`✅ [SYNC] Sincronización completada (${ops.length} operaciones).`);
}
