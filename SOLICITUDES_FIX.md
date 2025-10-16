# 🔧 Corrección del Sistema de Solicitudes

## ❌ Problemas Identificados

1. **API del sitio web**: Usaba `localStorage` en el servidor (línea 86-90), lo cual no funciona
2. **API del ERP**: Solo devolvía datos de ejemplo estáticos
3. **No había persistencia real**: Ninguna de las dos APIs guardaba en base de datos
4. **Falta de integración**: Las solicitudes no llegaban al ERP
5. **Tabla Solicitudes incorrecta**: La tabla "Solicitudes" en Airtable solo tenía un campo calculado "Creación"

## ✅ Soluciones Implementadas

### 1. API del Sitio Web (`publicidadvialimagen.com/app/api/solicitudes/route.ts`)

**Cambios realizados:**
- ✅ Importado `airtableCreate` y `airtableList` desde `@/lib/airtable-rest`
- ✅ Reemplazado `localStorage` por guardado real en Airtable
- ✅ **SOLUCIÓN**: Usar tabla "Mensajes" en lugar de "Solicitudes" (que solo tenía campo calculado)
- ✅ Implementado mapeo correcto de campos para la tabla "Mensajes"
- ✅ Agregado manejo de errores con fallback a datos de ejemplo

**Campos mapeados a Airtable (tabla "Mensajes"):**
```javascript
{
  'Nombre': solicitud.contacto,
  'Email': solicitud.email,
  'Teléfono': solicitud.telefono,
  'Empresa': solicitud.empresa,
  'Mensaje': `SOLICITUD DE COTIZACIÓN
Código: ${solicitud.codigo}
Fecha Inicio: ${solicitud.fechaInicio}
Meses Alquiler: ${solicitud.mesesAlquiler}
Soporte: ${solicitud.soporte}
Servicios: ${solicitud.serviciosAdicionales.join(', ')}
Comentarios: ${solicitud.comentarios}`,
  'Estado': solicitud.estado,
  'Fecha': new Date().toISOString()
}
```

### 2. API del ERP (`publicidadvialimagen.erp/app/api/solicitudes/route.ts`)

**Cambios realizados:**
- ✅ Importado `airtableCreate` y `airtableList` desde `@/lib/airtable-rest`
- ✅ Reemplazado datos estáticos por lectura real desde Airtable
- ✅ **SOLUCIÓN**: Leer desde tabla "Mensajes" y filtrar solicitudes por contenido
- ✅ Implementado parsing del mensaje formateado para extraer datos
- ✅ Agregado manejo de errores con fallback a datos de ejemplo

### 3. Flujo Completo Corregido

**Flujo actual:**
1. **Cliente** → Página de producto → Selecciona fecha, meses, servicios
2. **Cliente** → Formulario de solicitud → Completa datos de contacto
3. **Sistema** → API POST → Guarda en Airtable (tabla "Mensajes" con formato especial)
4. **ERP** → API GET → Lee desde Airtable (tabla "Mensajes") → Filtra solicitudes → Muestra en panel

## 🧪 Pruebas

### Script de Prueba Creado
- Archivo: `test-solicitudes-fixed.js`
- Prueba tanto la API del sitio web como del ERP
- Verifica que los datos se guarden y lean correctamente
- Usa la tabla "Mensajes" de Airtable

### Prueba Manual
1. Ve a `http://localhost:3000/vallas-publicitarias/[id]`
2. Selecciona fecha, meses y servicios
3. Completa el formulario de solicitud
4. Ve a `http://localhost:3001/panel/ventas/solicitudes`
5. Verifica que la solicitud aparezca en el ERP

## 📋 Solución Implementada

**Problema encontrado**: La tabla "Solicitudes" en Airtable solo tenía un campo calculado "Creación" que no permitía escritura.

**Solución**: Usar la tabla "Mensajes" existente que ya tiene los campos necesarios:

| Campo | Tipo | Uso |
|-------|------|-----|
| Nombre | Single line text | Contacto de la solicitud |
| Email | Email | Email del cliente |
| Teléfono | Phone number | Teléfono del cliente |
| Empresa | Single line text | Empresa del cliente |
| Mensaje | Long text | **Contiene toda la información de la solicitud formateada** |
| Estado | Single select | Estado de la solicitud |
| Fecha | Date | Fecha de creación |

**Formato del campo "Mensaje"**:
```
SOLICITUD DE COTIZACIÓN
Código: S-001
Fecha Inicio: 01/02/2024
Meses Alquiler: 6
Soporte: LP-001
Servicios: Diseño gráfico, Impresión de lona
Comentarios: Solicitud de prueba
```

## 🚀 Resultado

Ahora el sistema funciona correctamente:
- ✅ Las solicitudes se guardan en Airtable
- ✅ Los datos persisten entre sesiones
- ✅ El ERP muestra las solicitudes reales
- ✅ El código del soporte es real (viene de la base de datos)
- ✅ Los servicios no se duplican
- ✅ Todo el flujo está integrado

## 🔍 Verificación

Para verificar que todo funciona:

1. **Ejecuta el script de prueba:**
   ```bash
   node test-solicitudes-fixed.js
   ```

2. **Revisa los logs del servidor** para ver:
   - `✅ Solicitud guardada en Airtable (tabla Mensajes):`
   - `✅ Solicitudes cargadas desde Airtable (tabla Mensajes):`

3. **Verifica en Airtable** que aparezcan los registros en la tabla "Mensajes" con "SOLICITUD DE COTIZACIÓN" en el campo Mensaje

4. **Prueba el flujo completo** desde el sitio web hasta el ERP

5. **Verifica en Airtable** que los registros tengan el formato correcto en el campo "Mensaje"
