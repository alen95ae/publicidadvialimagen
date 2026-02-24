import { supabaseServer } from "@/lib/supabaseServer";
import {
  buildVariantDefinitionFromReceta,
  computeVariantCost,
  buildVariantKey
} from "./variantEngine";

import { generarCombinacionesVariantes } from "./generarCombinaciones";
import { calcularFinanzasVariante, type ProductoInput } from "@/lib/calcularVarianteFinanciera";

// Sucursales disponibles en el sistema (las mismas que en control de stock)
const SUCURSALES_DISPONIBLES = ["La Paz", "Santa Cruz"];

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

  // Guardar definiciones en producto.variante (SIN incluir Sucursal)
  const definicionesJSON = definiciones.map(d => ({
    nombre: d.nombre,
    valores: d.valores
  }));

  await supabaseServer
    .from("productos")
    .update({ variante: definicionesJSON })
    .eq("id", productId);

  // 5. Generar combinaciones de variantes del producto (sin sucursal)
  const combinacionesBase = generarCombinacionesVariantes(definiciones);

  // 6. IMPORTANTE: Multiplicar por sucursales (igual que en control de stock)
  // Para cada combinación de variantes, crear una por cada sucursal
  const combinacionesConSucursal: Array<{ combinacion: string; valores: Record<string, string> }> = [];

  SUCURSALES_DISPONIBLES.forEach(sucursal => {
    combinacionesBase.forEach(combo => {
      // Agregar sucursal a los valores de la combinación
      const valoresConSucursal = {
        ...combo.valores,
        Sucursal: sucursal
      };
      
      // Construir la clave con sucursal incluida
      const combinacion = buildVariantKey(valoresConSucursal);
      
      combinacionesConSucursal.push({
        combinacion,
        valores: valoresConSucursal
      });
    });
  });

  const combinacionesFinal = combinacionesConSucursal;

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

  // Calcular el coste base REAL de la receta (suma de cantidad × coste de recursos, sin variantes)
  // Esto asegura que dif_coste se calcule correctamente aunque producto.coste esté desactualizado
  const calcularCosteBaseRecetaReal = (receta: any[], recursosMap: Map<string, any>): number => {
    let costeBase = 0
    receta.forEach(item => {
      const recurso = recursosMap.get(item.recurso_id)
      if (recurso) {
        const cantidad = Number(item.cantidad) || 0
        const costeRecurso = Number(recurso.coste) || 0
        costeBase += cantidad * costeRecurso
      }
    })
    return Math.round(costeBase * 100) / 100
  }

  // Usar el coste base REAL calculado desde la receta, no producto.coste de la BD
  const costeBaseRecetaReal = calcularCosteBaseRecetaReal(receta, recursosMap);

  const productoInput: ProductoInput = {
    coste: Number(producto.coste) || 0,
    precio_venta: Number(producto.precio_venta) || 0,
  };

  for (const combo of combinacionesFinal) {
    const key = combo.combinacion;
    const valores = combo.valores;

    processedKeys.add(key);

    const sucursal = valores["Sucursal"] || valores["sucursal"];

    const coste = computeVariantCost(receta, recursos, valores, sucursal, costeBaseRecetaReal);
    const precio = coste;

    const existente = existentesMap.get(key);

    const varianteParaCalculo = {
      coste_override: existente?.coste_override ?? null,
      coste_calculado: coste,
      precio_override: existente?.precio_override ?? null,
      precio_calculado: precio,
    };
    const finanzas = calcularFinanzasVariante(varianteParaCalculo, productoInput);

    if (existente) {
      ops.push(
        supabaseServer
          .from("producto_variantes")
          .update({
            coste_calculado: coste,
            precio_calculado: precio,
            ...finanzas,
            updated_at_calculo: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString()
          })
          .eq("id", existente.id)
      );
    } else {
      ops.push(
        supabaseServer.from("producto_variantes").insert({
          producto_id: productId,
          combinacion: key,
          coste_calculado: coste,
          precio_calculado: precio,
          coste_override: null,
          precio_override: null,
          ...finanzas,
          updated_at_calculo: new Date().toISOString(),
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

  const results = await Promise.all(ops);
  
  // Verificar errores
  const errores = results.filter(r => r.error);
  if (errores.length > 0) {
    console.error(`❌ [SYNC] ${errores.length} errores encontrados:`, errores.map(e => e.error));
    throw new Error(`Error sincronizando variantes: ${errores[0].error.message}`);
  }

  console.log(`✅ [SYNC] Sincronización completada (${ops.length} operaciones).`);
}
