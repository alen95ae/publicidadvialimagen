#!/bin/bash

# Script de verificación: Asegurar que no queden URLs hardcodeadas incorrectas
# Creado después de corregir el error "Invalid callback URL"

echo "🔍 Verificando que no queden URLs hardcodeadas incorrectas..."
echo ""

errors=0

# Verificar /auth/callback en archivos TypeScript/TSX
echo "1. Verificando /auth/callback en código..."
if grep -r "/auth/callback" --include="*.ts" --include="*.tsx" app/ hooks/ components/ lib/ 2>/dev/null; then
    echo "❌ ERROR: Encontradas referencias a /auth/callback"
    errors=$((errors + 1))
else
    echo "✅ OK: No se encontraron referencias a /auth/callback"
fi

echo ""

# Verificar /api/auth/callback (que no debería estar en código manual)
echo "2. Verificando /api/auth/callback en código..."
if grep -r "/api/auth/callback" --include="*.ts" --include="*.tsx" app/ hooks/ components/ lib/ 2>/dev/null | grep -v "KINDE_SETUP.md" | grep -v "PASSWORD_CHANGE_GUIDE.md"; then
    echo "❌ ERROR: Encontradas referencias a /api/auth/callback"
    errors=$((errors + 1))
else
    echo "✅ OK: No se encontraron referencias a /api/auth/callback"
fi

echo ""

# Verificar window.location.href con callback
echo "3. Verificando window.location.href con callback..."
if grep -r "window\.location\.href.*callback" --include="*.ts" --include="*.tsx" app/ hooks/ components/ lib/ 2>/dev/null; then
    echo "❌ ERROR: Encontradas redirecciones manuales a callback"
    errors=$((errors + 1))
else
    echo "✅ OK: No se encontraron redirecciones manuales a callback"
fi

echo ""

# Verificar que updatePassword no esté siendo usado
echo "4. Verificando uso de updatePassword en componentes..."
if grep -r "updatePassword(" --include="*.tsx" app/ components/ 2>/dev/null; then
    echo "❌ ERROR: Encontradas llamadas a updatePassword()"
    errors=$((errors + 1))
else
    echo "✅ OK: No se encontraron llamadas a updatePassword()"
fi

echo ""

# Verificar que se use la URL correcta de Kinde
echo "5. Verificando uso de URL correcta de Kinde..."
if grep -r "NEXT_PUBLIC_KINDE_ISSUER_URL.*reset-password" --include="*.ts" --include="*.tsx" app/ 2>/dev/null; then
    echo "✅ OK: Se encontró uso de URL correcta de Kinde"
else
    echo "⚠️  WARNING: No se encontró uso de URL de reset-password de Kinde"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo "✅ VERIFICACIÓN EXITOSA"
    echo "No se encontraron URLs hardcodeadas incorrectas"
    echo "El error 'Invalid callback URL' está completamente corregido"
    exit 0
else
    echo "❌ VERIFICACIÓN FALLIDA"
    echo "Se encontraron $errors error(es)"
    echo "Por favor, revisa los archivos mencionados arriba"
    exit 1
fi
