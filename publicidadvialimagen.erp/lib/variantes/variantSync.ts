
import { supabaseServer } from '@/lib/supabaseServer'
import {
    buildVariantDefinitionFromReceta,
    computeVariantCost,
    normalizeVariantKey,
    VariantDefinition
} from './variantEngine'

/**
 * Sincroniza las variantes de un producto (Smart Regeneration).
 * 
 * 1. Lee la receta y recursos actuales.
 * 2. Reconstruye la definición de variantes (productos.variante).
 * 3. Genera todas las combinaciones posibles.
 * 4. Sincroniza con la tabla producto_variantes:
 *    - Inserta nuevas.
 *    - Actualiza costes/precios de existentes (preservando overrides).
 *    - Elimina obsoletas.
 */
export async function syncProductVariants(productId: string) {
    console.log(`🔄 [SYNC] Iniciando sincronización para producto ${productId}`)

    // 1. Obtener producto y receta
    const { data: producto, error: prodError } = await supabaseServer
        .from('productos')
        .select('*')
        .eq('id', productId)
        .single()

    if (prodError || !producto) {
        throw new Error(`Producto no encontrado: ${prodError?.message}`)
    }

    let receta = producto.receta || []
    if (typeof receta === 'object' && !Array.isArray(receta)) {
        receta = receta.items || []
    }
    if (!Array.isArray(receta)) receta = []

    if (receta.length === 0) {
        console.log(`⚠️ [SYNC] Producto sin receta. Eliminando variantes.`)
        await supabaseServer.from('producto_variantes').delete().eq('producto_id', productId)
        await supabaseServer.from('productos').update({ variante: [] }).eq('id', productId)
        return
    }

    // 2. Obtener recursos
    const recursoIds = receta.map((r: any) => r.recurso_id).filter(Boolean)
    const { data: recursos, error: recError } = await supabaseServer
        .from('recursos')
        .select('*')
        .in('id', recursoIds)

    if (recError || !recursos) {
        throw new Error(`Error cargando recursos: ${recError?.message}`)
    }

    // 3. Construir definición de variantes desde la receta
    const definiciones = buildVariantDefinitionFromReceta(receta)

    // Guardar definición en el producto (Source of Truth)
    // Convertir a formato JSON compatible
    const definicionesJSON = definiciones.map(d => ({
        nombre: d.nombre,
        valores: d.valores
    }))

    await supabaseServer
        .from('productos')
        .update({ variante: definicionesJSON })
        .eq('id', productId)

    // 4. Generar combinaciones (incluyendo Sucursal)
    // Añadir Sucursal dinámicamente
    const definicionesConSucursal = [
        ...definiciones,
        { nombre: 'Sucursal', valores: ['La Paz', 'Santa Cruz'] }
    ]

    const combinaciones = generarCombinaciones(definicionesConSucursal)

    // 5. Obtener variantes existentes
    const { data: existentes } = await supabaseServer
        .from('producto_variantes')
        .select('*')
        .eq('producto_id', productId)

    const existentesMap = new Map(existentes?.map((v: any) => [v.combinacion, v]))

    // 6. Procesar sincronización
    const ops = []
    const combinacionesProcesadas = new Set<string>()

    for (const combo of combinaciones) {
        const key = combo.key // Clave normalizada (ej: "color=rojo|sucursal=la paz")
        // Nota: Si queremos mantener compatibilidad visual, podríamos guardar también un "display_key"
        // Pero el usuario pidió normalización. Usaremos la clave normalizada en la BD.

        combinacionesProcesadas.add(key)

        // Calcular costes
        const coste = computeVariantCost(receta, recursos, combo.valores, combo.valores['Sucursal'] || combo.valores['sucursal'])

        // Calcular precio (simple markup o lógica compleja - por ahora simple markup sobre coste si no hay calculadora)
        // TODO: Integrar calculadora de precios si es necesario. Por ahora usamos coste como base.
        let precio = coste // Placeholder

        // Si existe calculadora en el producto, usarla (lógica simplificada)
        // ... (Podríamos importar calcularPrecioVariante si fuera necesario)

        const existente = existentesMap.get(key)

        if (existente) {
            // ACTUALIZAR (Update)
            // Solo actualizamos costes calculados. Preservamos overrides.
            const difCoste = coste - (producto.coste || 0) // Dif vs coste base actual

            ops.push(
                supabaseServer
                    .from('producto_variantes')
                    .update({
                        coste_calculado: coste,
                        // precio_calculado: precio, // Solo si tuviéramos lógica de precio
                        fecha_actualizacion: new Date().toISOString()
                    })
                    .eq('id', existente.id)
            )
        } else {
            // INSERTAR (Create)
            ops.push(
                supabaseServer
                    .from('producto_variantes')
                    .insert({
                        producto_id: productId,
                        combinacion: key,
                        coste_calculado: coste,
                        precio_calculado: precio,
                        coste_override: null,
                        precio_override: null,
                        dif_precio: null // Asegurar que columna existe
                    })
            )
        }
    }

    // 7. Eliminar obsoletas
    const aEliminar = existentes?.filter((v: any) => !combinacionesProcesadas.has(v.combinacion)) || []
    if (aEliminar.length > 0) {
        const ids = aEliminar.map((v: any) => v.id)
        ops.push(
            supabaseServer
                .from('producto_variantes')
                .delete()
                .in('id', ids)
        )
    }

    // Ejecutar operaciones
    await Promise.all(ops)
    console.log(`✅ [SYNC] Sincronización completada. ${ops.length} operaciones.`)
}

// Helper local para generar combinaciones cartesianas
function generarCombinaciones(defs: VariantDefinition[]): { key: string, valores: Record<string, string> }[] {
    if (defs.length === 0) return []

    const result: { key: string, valores: Record<string, string> }[] = []

    function backtrack(index: number, current: Record<string, string>) {
        if (index === defs.length) {
            result.push({
                key: normalizeVariantKey(current),
                valores: { ...current }
            })
            return
        }

        const def = defs[index]
        for (const val of def.valores) {
            current[def.nombre] = val
            backtrack(index + 1, current)
        }
    }

    backtrack(0, {})
    return result
}
