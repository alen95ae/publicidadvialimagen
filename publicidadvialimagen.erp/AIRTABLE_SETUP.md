# Configuración de Airtable

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## Configuración de Airtable

### 1. Obtener API Key
1. Ve a [Airtable Account](https://airtable.com/account)
2. En la sección "API" genera una nueva API key
3. Copia la API key y agrégala a tu archivo `.env.local`

### 2. Obtener Base ID
1. Ve a tu base de datos en Airtable
2. En la URL, el Base ID es la parte después de `/app` y antes del primer `/`
3. Ejemplo: `https://airtable.com/appXXXXXXXXXXXXXX/...` → Base ID es `appXXXXXXXXXXXXXX`

### 3. Configurar Tablas

Crea las siguientes tablas en tu base de Airtable:

#### Tabla: Soportes
- **Codigo** (Single line text) - Código único del soporte
- **Titulo** (Single line text) - Título del soporte
- **Tipo Soporte** (Single select) - Opciones: Vallas Publicitarias, Pantallas LED, Murales, Publicidad Móvil
- **Estado** (Single select) - Opciones: disponible, ocupado, reservado, no_disponible
- **Ancho** (Number) - Ancho en metros
- **Alto** (Number) - Alto en metros
- **Ciudad** (Single line text) - Ciudad donde está ubicado
- **Precio Mes** (Currency) - Precio mensual
- **Impactos Diarios** (Number) - Número de impactos diarios
- **Ubicacion URL** (URL) - URL de Google Maps
- **Foto URL** (URL) - URL de la foto principal
- **Foto URL 2** (URL) - URL de la segunda foto
- **Foto URL 3** (URL) - URL de la tercera foto
- **Notas** (Long text) - Notas adicionales
- **Propietario ID** (Link to another record) - Referencia al propietario
- **Empleado Responsable ID** (Link to another record) - Referencia al empleado responsable
- **Fecha Instalacion** (Date) - Fecha de instalación
- **Fecha Ultimo Mantenimiento** (Date) - Fecha del último mantenimiento
- **Proximo Mantenimiento** (Date) - Próxima fecha de mantenimiento

#### Tabla: Propietarios
- **Nombre** (Single line text) - Nombre del propietario
- **Contacto** (Single line text) - Persona de contacto
- **Email** (Email) - Email del propietario
- **Telefono** (Phone number) - Teléfono
- **Direccion** (Long text) - Dirección
- **Ciudad** (Single line text) - Ciudad
- **Codigo Postal** (Single line text) - Código postal
- **Pais** (Single line text) - País
- **Tipo Propietario** (Single select) - Opciones: persona, empresa, ayuntamiento
- **Condiciones Renta** (Long text) - Condiciones de renta
- **Porcentaje Comision** (Percent) - Porcentaje de comisión
- **Renta Fija** (Currency) - Renta fija mensual
- **Estado** (Single select) - Opciones: activo, inactivo
- **Notas** (Long text) - Notas adicionales

#### Tabla: Clientes
- **Nombre Comercial** (Single line text) - Nombre comercial
- **Nombre Contacto** (Single line text) - Nombre del contacto
- **Email** (Email) - Email del cliente
- **Telefono** (Phone number) - Teléfono
- **CIF NIF** (Single line text) - CIF/NIF
- **Direccion** (Long text) - Dirección
- **Ciudad** (Single line text) - Ciudad
- **Codigo Postal** (Single line text) - Código postal
- **Pais** (Single line text) - País
- **Tipo Cliente** (Single select) - Opciones: persona, empresa
- **Estado** (Single select) - Opciones: activo, inactivo, suspendido
- **Notas** (Long text) - Notas adicionales

#### Tabla: Empleados
- **Nombre** (Single line text) - Nombre del empleado
- **Apellidos** (Single line text) - Apellidos
- **Email** (Email) - Email del empleado
- **Telefono** (Phone number) - Teléfono
- **Rol** (Single select) - Opciones: admin, comercial, tecnico, administrativo, gerente
- **Departamento** (Single line text) - Departamento
- **Salario Base** (Currency) - Salario base
- **Fecha Contratacion** (Date) - Fecha de contratación
- **Estado** (Single select) - Opciones: activo, inactivo, vacaciones
- **Direccion** (Long text) - Dirección
- **Ciudad** (Single line text) - Ciudad
- **Codigo Postal** (Single line text) - Código postal
- **Notas** (Long text) - Notas adicionales

## Uso de la API

Una vez configurado, los endpoints de la API funcionarán automáticamente con Airtable:

- `GET /api/soportes` - Obtener lista de soportes
- `POST /api/soportes` - Crear o actualizar soporte
- `POST /api/soportes/bulk` - Operaciones masivas (eliminar, duplicar, actualizar)

## Notas Importantes

1. **Permisos**: Asegúrate de que tu API key tenga permisos de lectura y escritura en la base
2. **Límites de API**: Airtable tiene límites de rate limiting, considera implementar caché si es necesario
3. **Campos requeridos**: Algunos campos son obligatorios en Airtable, asegúrate de que coincidan con la configuración
4. **Relaciones**: Los campos de tipo "Link to another record" deben apuntar a registros existentes en las tablas relacionadas
