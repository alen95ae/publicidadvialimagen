"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrarVariantesProductos = migrarVariantesProductos;
const supabaseServer_1 = require("../supabaseServer");
const supabaseRecursos_1 = require("../supabaseRecursos");
const generarCombinaciones_1 = require("./generarCombinaciones");
function extraerVariantesDeRecurso(recurso) {
    var _a;
    let variantes = (_a = recurso.variantes) !== null && _a !== void 0 ? _a : [];
    // Caso 1: es string JSON
    if (typeof variantes === "string") {
        try {
            variantes = JSON.parse(variantes);
        }
        catch {
            variantes = [];
        }
    }
    // Caso 2: viene como { variates: [...] }
    if (variantes === null || variantes === void 0 ? void 0 : variantes.variantes) {
        variantes = variantes.variantes;
    }
    return Array.isArray(variantes) ? variantes : [];
}
async function migrarVariantesProductos() {
    var _a;
    console.log("🔧 Iniciando migración de variantes completas...");
    const { data: productos, error } = await supabaseServer_1.supabaseServer
        .from("productos")
        .select("*");
    if (error) {
        console.error("❌ Error obteniendo productos:", error);
        return;
    }
    const productosLista = productos !== null && productos !== void 0 ? productos : [];
    // Procesar TODOS los productos que tengan receta (para forzar actualización completa de variantes)
    // Esto asegura que incluso productos ya migrados se actualicen con los valores completos
    const productosObjetivo = productosLista.filter((p) => {
        var _a;
        if (p == null)
            return false;
        // Solo procesar productos que tengan receta (necesitamos recursos para extraer variantes)
        const receta = (_a = p.receta) !== null && _a !== void 0 ? _a : [];
        return Array.isArray(receta) && receta.length > 0;
    });
    console.log(`📦 Productos totales: ${productosLista.length} | Productos a reparar: ${productosObjetivo.length}`);
    for (const producto of productosObjetivo) {
        console.log(`\n🔍 Procesando producto ${producto.id} (${producto.nombre || producto.codigo})`);
        console.log(`   Variantes actuales:`, JSON.stringify(producto.variante, null, 2));
        const receta = (_a = producto.receta) !== null && _a !== void 0 ? _a : [];
        if (receta.length === 0) {
            console.log(`➡️ Producto ${producto.id} sin receta. Saltando.`);
            continue;
        }
        // 1. Obtener recursos usados en el producto
        const recursoIds = receta.map((r) => r.recurso_id);
        const { data: recursosDB } = await supabaseServer_1.supabaseServer
            .from("recursos")
            .select("*")
            .in("id", recursoIds);
        if (!recursosDB)
            continue;
        const recursos = recursosDB.map(supabaseRecursos_1.supabaseToRecurso);
        // 2. Extraer definiciones de variantes desde cada recurso
        const variantesDef = [];
        for (const recurso of recursos) {
            const variantes = extraerVariantesDeRecurso(recurso);
            variantes.forEach((v) => {
                var _a, _b;
                const nombre = v.nombre;
                let valores = (_b = (_a = v.posibilidades) !== null && _a !== void 0 ? _a : v.valores) !== null && _b !== void 0 ? _b : [];
                if (!nombre || !Array.isArray(valores) || valores.length === 0) {
                    return;
                }
                // Limpiar valores: si vienen con código de color (ej: "Blanco Brillo:#fffcfc"), 
                // extraer solo el nombre del color
                valores = valores.map((valor) => {
                    if (typeof valor === "string" && valor.includes(":")) {
                        const partes = valor.split(":");
                        // Si la segunda parte es un código hexadecimal, solo usar la primera parte
                        if (partes.length === 2 && /^#[0-9A-Fa-f]{6}$/i.test(partes[1].trim())) {
                            return partes[0].trim();
                        }
                    }
                    return String(valor).trim();
                }).filter((v) => v.length > 0); // Filtrar valores vacíos
                if (valores.length === 0)
                    return;
                const existente = variantesDef.find((x) => x.nombre === nombre);
                if (existente) {
                    // Combinar valores únicos
                    existente.valores = Array.from(new Set([...existente.valores, ...valores]));
                }
                else {
                    variantesDef.push({
                        nombre,
                        valores,
                    });
                }
            });
        }
        // Log para debug
        if (variantesDef.length > 0) {
            console.log(`📋 Variantes extraídas para producto ${producto.id}:`, JSON.stringify(variantesDef, null, 2));
        }
        if (variantesDef.length === 0) {
            console.log(`⚠️ Producto ${producto.id} no tiene variantes en sus recursos. Se omite sin cambios.`);
            continue;
        }
        // 3. Actualizar el campo variante en productos
        const variantesParaGuardar = variantesDef.length > 0 ? variantesDef : null;
        console.log(`💾 Guardando variantes para producto ${producto.id}:`, JSON.stringify(variantesParaGuardar, null, 2));
        const { error: updateError } = await supabaseServer_1.supabaseServer
            .from("productos")
            .update({
            variante: variantesParaGuardar,
        })
            .eq("id", producto.id);
        if (updateError) {
            console.error(`❌ Error actualizando variantes para producto ${producto.id}:`, updateError);
            continue;
        }
        console.log(`✔ Variante (definición) actualizada para producto ${producto.id}`);
        // 4. Añadir SUCURSAL como variante fija del sistema
        const variantesConSucursal = [
            ...variantesDef,
            {
                nombre: "Sucursal",
                valores: ["La Paz", "Santa Cruz"],
            },
        ];
        // 5. GENERAR TODAS LAS COMBINACIONES
        console.log(`🔄 Generando combinaciones con variantes:`, JSON.stringify(variantesConSucursal, null, 2));
        const combinaciones = (0, generarCombinaciones_1.generarCombinacionesVariantes)(variantesConSucursal);
        console.log(`📊 Generadas ${combinaciones.length} combinaciones para producto ${producto.id}`);
        if (combinaciones.length > 0) {
            console.log(`📝 Primeras 3 combinaciones:`, combinaciones.slice(0, 3).map(c => c.combinacion));
        }
        // 6. Borrar variantes viejas
        const { error: deleteError } = await supabaseServer_1.supabaseServer
            .from("producto_variantes")
            .delete()
            .eq("producto_id", producto.id);
        if (deleteError) {
            console.error(`❌ Error borrando variantes viejas para producto ${producto.id}:`, deleteError);
            continue;
        }
        // 7. Insertar variantes nuevas
        const nuevas = combinaciones.map((c) => ({
            producto_id: producto.id,
            combinacion: c.combinacion, // Asegurar que usamos la propiedad correcta
            precio_base: producto.precio_base,
            precio_override: null,
            dif_precio: null,
        }));
        const { error: insertError } = await supabaseServer_1.supabaseServer
            .from("producto_variantes")
            .insert(nuevas);
        if (insertError) {
            console.error(`❌ Error insertando variantes nuevas para producto ${producto.id}:`, insertError);
            continue;
        }
        console.log(`✔ ${nuevas.length} variantes regeneradas para producto ${producto.id}`);
    }
    console.log("🎉 Migración completada correctamente.");
}
