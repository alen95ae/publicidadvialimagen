# Guía de Importación y Exportación de Soportes

## Campos del CSV

El archivo CSV debe contener los siguientes campos (en cualquier orden):

### Campos Obligatorios
- **Codigo**: Código único del soporte (ej: V001, V002)
- **Titulo**: Título/descripción del soporte
- **Tipo Soporte**: Tipo de soporte (Vallas Publicitarias, Pantallas LED, Murales, Publicidad Móvil)
- **Estado**: Estado del soporte (disponible, ocupado, reservado, no_disponible)

### Campos Opcionales
- **Ciudad**: Ciudad donde está ubicado el soporte
- **Ancho**: Ancho en metros (ej: 3.5)
- **Alto**: Alto en metros (ej: 2.5)
- **Precio por mes**: Precio mensual en la moneda local
- **Impactos dia**: Número de impactos diarios estimados
- **Ubicación**: URL de Google Maps o descripción de la ubicación
- **Propietario**: Nombre del propietario del soporte
- **Notas**: Notas adicionales sobre el soporte

## Ejemplo de CSV

```csv
Ciudad,Estado,Titulo,Precio por mes,Codigo,Ancho,Alto,Impactos dia,Ubicación,Tipo Soporte,Propietario,Notas
La Paz,disponible,Valla Principal Zona Sur,1500,V001,3.5,2.5,5000,Zona Sur La Paz,Vallas Publicitarias,Propietario por Defecto,Ubicación estratégica en zona sur
Santa Cruz,disponible,Billboard Centro Comercial,2500,V002,4.0,3.0,8000,Centro Comercial SCZ,Pantallas LED,Propietario por Defecto,Centro comercial con alto tráfico
```

## Tipos de Soporte Válidos

- **Vallas Publicitarias**: Para vallas tradicionales, monopostes, bipostes, etc.
- **Pantallas LED**: Para pantallas digitales y displays LED
- **Murales**: Para murales publicitarios y marquesinas
- **Publicidad Móvil**: Para publicidad móvil, pasacalles, etc.

## Estados Válidos

- **disponible**: El soporte está disponible para alquiler
- **ocupado**: El soporte está siendo utilizado
- **reservado**: El soporte está reservado para un cliente
- **no_disponible**: El soporte no está disponible (mantenimiento, etc.)

## Notas Importantes

1. **Códigos únicos**: Cada soporte debe tener un código único. Si se importa un código que ya existe, se actualizará el registro existente.

2. **Propietario por defecto**: Si no se especifica un propietario, se asignará automáticamente el "Propietario por Defecto".

3. **Validación de tipos**: Los tipos de soporte se normalizan automáticamente. Por ejemplo, "valla" se convierte a "Vallas Publicitarias".

4. **Cálculo automático**: El área total se calcula automáticamente como ancho × alto.

5. **Formato de números**: Los números pueden incluir separadores de miles y decimales (ej: 1,500.50 o 1500.50).

## API Endpoints

- **GET /api/soportes**: Obtener lista de soportes con filtros
- **POST /api/soportes**: Crear o actualizar soporte individual
- **POST /api/soportes/bulk**: Operaciones masivas (eliminar, duplicar, actualizar)

## Ejemplo de Uso Programático

```typescript
import { processCsvRow, buildPayload } from '@/app/api/soportes/helpers'

// Procesar una fila de CSV
const csvData = {
  Codigo: 'V001',
  Titulo: 'Valla Principal',
  'Tipo Soporte': 'Vallas Publicitarias',
  Estado: 'disponible',
  Ancho: '3.5',
  Alto: '2.5',
  Ciudad: 'La Paz',
  'Precio por mes': '1500'
}

const processedData = processCsvRow(csvData)
const payload = buildPayload(processedData)
```
