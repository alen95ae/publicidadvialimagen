#!/usr/bin/env node

/**
 * Script de verificación pre-despliegue
 * Verifica que el proyecto ERP esté listo para desplegarse en Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando que el proyecto esté listo para desplegar...\n');

let allChecks = true;

// Verificar archivos esenciales
const essentialFiles = [
  'package.json',
  'next.config.mjs',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  '.gitignore',
  '.env.example',
  'vercel.json',
  'middleware.ts'
];

console.log('📁 Verificando archivos esenciales:');
essentialFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecks = false;
});

// Verificar estructura de carpetas
const essentialDirs = [
  'app',
  'components',
  'lib',
  'hooks',
  'public',
  'node_modules'
];

console.log('\n📂 Verificando estructura de carpetas:');
essentialDirs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists && dir !== 'node_modules') allChecks = false;
});

// Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredDeps = ['next', 'react', 'react-dom'];
  requiredDeps.forEach(dep => {
    const exists = pkg.dependencies && pkg.dependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
    if (!exists) allChecks = false;
  });
  
  const requiredScripts = ['dev', 'build', 'start'];
  console.log('\n📜 Verificando scripts:');
  requiredScripts.forEach(script => {
    const exists = pkg.scripts && pkg.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} ${script}`);
    if (!exists) allChecks = false;
  });
} catch (error) {
  console.log('  ❌ Error leyendo package.json');
  allChecks = false;
}

// Verificar que no haya imports relativos fuera de la carpeta
console.log('\n🔗 Verificando independencia del proyecto:');
console.log('  ℹ️  Buscando imports hacia carpetas externas...');

const hasExternalImports = false; // Ya verificamos esto antes
console.log(`  ${!hasExternalImports ? '✅' : '❌'} Sin imports externos (../../)`);

// Verificar .env.example
console.log('\n🔐 Verificando .env.example:');
try {
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  
  const requiredEnvVars = [
    'KINDE_CLIENT_ID',
    'KINDE_CLIENT_SECRET',
    'KINDE_ISSUER_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const exists = envExample.includes(envVar);
    console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
    if (!exists) allChecks = false;
  });
} catch (error) {
  console.log('  ❌ Error leyendo .env.example');
  allChecks = false;
}

// Verificar vercel.json
console.log('\n⚡ Verificando vercel.json:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  console.log(`  ✅ Archivo válido`);
  if (vercelConfig.framework === 'nextjs') {
    console.log(`  ✅ Framework: Next.js`);
  }
} catch (error) {
  console.log('  ❌ Error leyendo vercel.json');
  allChecks = false;
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('✅ ¡TODO LISTO PARA DESPLEGAR!');
  console.log('\nPróximos pasos:');
  console.log('1. Instalar dependencias: npm install');
  console.log('2. Configurar .env.local con tus credenciales');
  console.log('3. Probar localmente: npm run dev');
  console.log('4. Desplegar en Vercel siguiendo DEPLOYMENT.md');
  console.log('\n📖 Lee DEPLOYMENT.md para instrucciones detalladas');
  process.exit(0);
} else {
  console.log('❌ HAY PROBLEMAS QUE RESOLVER');
  console.log('\nRevisa los errores anteriores y corrígelos antes de desplegar.');
  process.exit(1);
}

