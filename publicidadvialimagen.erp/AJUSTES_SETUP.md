# 🔧 Configuración del Módulo de Ajustes

## 🚨 Problema: No se puede acceder al módulo de ajustes

Si no puedes acceder al módulo de ajustes desde el menú lateral (ícono de tuerca), es porque **solo los usuarios con rol "admin" pueden acceder**.

## ✅ Solución: Crear un usuario administrador

### Opción 1: Usar el script automático (Recomendado)

```bash
# Desde la raíz del proyecto ERP
node scripts/create-admin-user.js
```

Este script:
- ✅ Verifica si ya existen usuarios administradores
- ✅ Crea un usuario admin por defecto si no existe
- ✅ Usa las credenciales: `admin@publicidadvialimagen.com` / `admin123`

### Opción 2: Crear manualmente en Airtable

1. **Accede a tu base de Airtable**
2. **Ve a la tabla "Users" (o la que tengas configurada)**
3. **Crea un nuevo registro con:**
   - `Email`: `admin@publicidadvialimagen.com`
   - `Nombre`: `Administrador del Sistema`
   - `Rol`: `admin`
   - `Activo`: `true`
   - `PasswordHash`: (generar con bcrypt)

### Opción 3: Actualizar usuario existente

Si ya tienes un usuario registrado:

1. **En Airtable, busca tu usuario**
2. **Cambia el campo "Rol" a "admin"**
3. **Guarda los cambios**

## 🔐 Credenciales por defecto

```
Email: admin@publicidadvialimagen.com
Contraseña: admin123
```

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login.

## 🎯 Verificar el acceso

1. **Inicia sesión** con las credenciales de administrador
2. **Haz clic en el ícono de tuerca** en el menú lateral
3. **Deberías ver el módulo de Ajustes** con tres pestañas:
   - 👥 Usuarios
   - 🛡️ Roles y Permisos  
   - 📧 Invitaciones

## 🔍 Debugging

Si sigues sin poder acceder:

### 1. Verificar tu rol actual
```bash
# Abre la consola del navegador y ejecuta:
fetch('/api/debug/user-role').then(r => r.json()).then(console.log)
```

### 2. Verificar logs del servidor
```bash
# En la terminal donde corre el servidor, busca:
# "Access denied to ajustes - user role: [tu_rol]"
```

### 3. Verificar variables de entorno
```bash
# Asegúrate de que estén configuradas:
echo $AIRTABLE_BASE_ID
echo $AIRTABLE_API_KEY
echo $AIRTABLE_TABLE_USERS
```

## 📋 Estructura de la tabla Users en Airtable

Asegúrate de que tu tabla tenga estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Email` | Single line text | Email del usuario |
| `Nombre` | Single line text | Nombre completo |
| `Rol` | Single select | admin, gestor, visualizador, usuario |
| `Activo` | Checkbox | Si el usuario está activo |
| `PasswordHash` | Long text | Hash de la contraseña |
| `FechaCreacion` | Date | Fecha de creación |

## 🚀 Una vez configurado

Con el usuario administrador podrás:

1. **Gestionar usuarios** - Crear, editar, suspender usuarios
2. **Configurar roles** - Definir permisos por módulo
3. **Crear invitaciones** - Generar enlaces para nuevos usuarios
4. **Controlar accesos** - Sistema completo de permisos

## 🆘 Soporte

Si tienes problemas:

1. **Verifica los logs** del servidor para errores
2. **Comprueba las variables** de entorno de Airtable
3. **Revisa la estructura** de la tabla Users
4. **Contacta al equipo** de desarrollo

---
**Módulo de Ajustes v1.0** - ERP Publicidad Vial Imagen
