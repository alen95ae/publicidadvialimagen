/**
 * Script para verificar la configuración del módulo de Calendario
 * Ejecutar con: node scripts/check-calendar-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del módulo Calendario...\n');

let allGood = true;

// Verificar archivos principales
const files = [
  'lib/calendar-api.ts',
  'lib/calendar-client.ts',
  'app/api/calendario/route.ts',
  'app/api/calendario/[id]/route.ts',
  'app/api/calendario/empleados/route.ts',
  'components/calendar/CalendarView.tsx',
  'components/calendar/EventCard.tsx',
  'app/panel/calendario/page.tsx',
  'app/panel/calendario/CalendarClient.tsx',
  'styles/calendar.css',
  'CALENDARIO_SETUP.md'
];

console.log('📁 Verificando archivos...');
files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
    allGood = false;
  }
});

// Verificar variables de entorno
console.log('\n🔐 Verificando variables de entorno...');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName}`);
    } else {
      console.log(`  ⚠️  ${varName} - NO CONFIGURADA`);
      allGood = false;
    }
  });
} else {
  console.log('  ⚠️  Archivo .env.local no encontrado');
  allGood = false;
}

// Verificar dependencias
console.log('\n📦 Verificando dependencias...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'react-big-calendar',
    'moment',
    'airtable',
    'date-fns'
  ];

  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`  ✅ ${dep} (${dependencies[dep]})`);
    } else {
      console.log(`  ❌ ${dep} - NO INSTALADO`);
      allGood = false;
    }
  });
} else {
  console.log('  ❌ package.json no encontrado');
  allGood = false;
}

// Verificar integración en sidebar
console.log('\n🔗 Verificando integración con sidebar...');
const sidebarPath = path.join(__dirname, '..', 'components', 'sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  if (sidebarContent.includes('calendario') && sidebarContent.includes('/panel/calendario')) {
    console.log('  ✅ Módulo integrado en sidebar');
  } else {
    console.log('  ⚠️  Módulo no encontrado en sidebar');
    allGood = false;
  }
} else {
  console.log('  ❌ sidebar.tsx no encontrado');
  allGood = false;
}

// Verificar importación de estilos
console.log('\n🎨 Verificando estilos...');
const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
if (fs.existsSync(globalsCssPath)) {
  const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
  if (cssContent.includes('calendar.css')) {
    console.log('  ✅ Estilos del calendario importados');
  } else {
    console.log('  ⚠️  Estilos del calendario no importados en globals.css');
    allGood = false;
  }
} else {
  console.log('  ❌ globals.css no encontrado');
  allGood = false;
}

// Resumen final
console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ ¡Todo configurado correctamente!');
  console.log('\n📖 Próximos pasos:');
  console.log('   1. Configura las tablas en Airtable (ver CALENDARIO_SETUP.md)');
  console.log('   2. Verifica las variables de entorno');
  console.log('   3. Ejecuta: npm run dev');
  console.log('   4. Navega a /panel/calendario');
} else {
  console.log('⚠️  Hay algunos problemas en la configuración');
  console.log('   Revisa los mensajes anteriores y corrige los errores.');
}
console.log('='.repeat(60) + '\n');

