#!/usr/bin/env node

/**
 * Script para crear un usuario administrador
 * Uso: node scripts/create-admin-user.js
 */

const { airtableCreate, airtableList } = require('../lib/airtable-rest');
const bcrypt = require('bcryptjs');

const USERS_TABLE = process.env.AIRTABLE_TABLE_USERS || "Users";

async function createAdminUser() {
  try {
    console.log("🔍 Verificando si ya existe un usuario administrador...");
    
    // Buscar usuarios existentes con rol admin
    const existingAdmins = await airtableList(USERS_TABLE, {
      filterByFormula: `{Rol} = "admin"`,
      maxRecords: "10"
    });

    if (existingAdmins.records.length > 0) {
      console.log("✅ Ya existen usuarios administradores:");
      existingAdmins.records.forEach(admin => {
        console.log(`   - ${admin.fields.Nombre} (${admin.fields.Email})`);
      });
      return;
    }

    console.log("❌ No se encontraron usuarios administradores.");
    console.log("📝 Creando usuario administrador por defecto...");

    // Crear usuario administrador por defecto
    const adminEmail = "admin@publicidadvialimagen.com";
    const adminPassword = "admin123"; // Cambiar en producción
    const adminName = "Administrador del Sistema";

    // Verificar si el email ya existe
    const existingUser = await airtableList(USERS_TABLE, {
      filterByFormula: `{Email} = "${adminEmail}"`,
      maxRecords: "1"
    });

    if (existingUser.records.length > 0) {
      console.log("⚠️  El email admin@publicidadvialimagen.com ya existe.");
      console.log("🔄 Actualizando rol a administrador...");
      
      // Actualizar el usuario existente a admin
      const { airtableUpdate } = require('../lib/airtable-rest');
      await airtableUpdate(USERS_TABLE, existingUser.records[0].id, {
        Rol: "admin",
        Activo: true
      });
      
      console.log("✅ Usuario actualizado a administrador exitosamente.");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Contraseña: ${adminPassword}`);
      console.log("⚠️  IMPORTANTE: Cambia la contraseña después del primer login.");
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Crear el usuario administrador
    const adminUser = {
      Email: adminEmail,
      Nombre: adminName,
      Rol: "admin",
      Activo: true,
      PasswordHash: passwordHash,
      FechaCreacion: new Date().toISOString()
    };

    const result = await airtableCreate(USERS_TABLE, [{ fields: adminUser }]);
    
    if (result.records && result.records.length > 0) {
      console.log("✅ Usuario administrador creado exitosamente!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Contraseña: ${adminPassword}`);
      console.log("⚠️  IMPORTANTE: Cambia la contraseña después del primer login.");
      console.log("🔗 Accede a: http://localhost:3000/login");
    } else {
      console.error("❌ Error al crear usuario administrador");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("💡 Asegúrate de que las variables de entorno estén configuradas:");
    console.error("   - AIRTABLE_BASE_ID");
    console.error("   - AIRTABLE_API_KEY");
    console.error("   - AIRTABLE_TABLE_USERS");
  }
}

// Ejecutar el script
createAdminUser();
