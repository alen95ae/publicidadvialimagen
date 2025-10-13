#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Uso: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar si existe .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

console.log('📁 Archivos de configuración:');
console.log(`   .env.local: ${fs.existsSync(envLocalPath) ? '✅ Existe' : '❌ No existe'}`);
console.log(`   .env.example: ${fs.existsSync(envExamplePath) ? '✅ Existe' : '❌ No existe'}`);

if (!fs.existsSync(envLocalPath)) {
  console.log('\n❌ PROBLEMA: No existe el archivo .env.local');
  console.log('\n📋 SOLUCIÓN:');
  console.log('1. Crea un archivo .env.local en la raíz del proyecto');
  console.log('2. Agrega las variables necesarias (ver SETUP_ENV.md)');
  console.log('3. Reinicia la aplicación');
  process.exit(1);
}

// Leer y verificar variables
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('\n🔧 Variables de entorno encontradas:');
const requiredVars = [
  'AIRTABLE_BASE_ID',
  'AIRTABLE_API_KEY',
  'AIRTABLE_TABLE_SOPORTES',
  'AIRTABLE_TABLE_CONTACTOS',
  'AIRTABLE_TABLE_MENSAJES',
  'AIRTABLE_TABLE_DUENOS_CASA'
];

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const hasVar = lines.some(line => line.startsWith(`${varName}=`));
  const status = hasVar ? '✅' : '❌';
  console.log(`   ${status} ${varName}`);
  if (!hasVar) allVarsPresent = false;
});

if (!allVarsPresent) {
  console.log('\n❌ PROBLEMA: Faltan variables de entorno requeridas');
  console.log('\n📋 SOLUCIÓN:');
  console.log('1. Revisa el archivo .env.local');
  console.log('2. Asegúrate de que todas las variables estén definidas');
  console.log('3. Verifica que no tengan valores de ejemplo (XXXXXXXXXXXXXX)');
  process.exit(1);
}

// Verificar valores de ejemplo
console.log('\n🔍 Verificando valores de configuración:');
let hasExampleValues = false;

lines.forEach(line => {
  if (line.includes('XXXXXXXXXXXXXX') || line.includes('your_')) {
    const [key] = line.split('=');
    console.log(`   ⚠️  ${key}: Tiene valor de ejemplo`);
    hasExampleValues = true;
  }
});

if (hasExampleValues) {
  console.log('\n⚠️  ADVERTENCIA: Algunas variables tienen valores de ejemplo');
  console.log('   Reemplaza estos valores con los reales de tu cuenta de Airtable');
}

console.log('\n✅ Configuración básica verificada');
console.log('\n🚀 Para probar la conexión:');
console.log('   npm run dev');
console.log('   Visita: http://localhost:3002');