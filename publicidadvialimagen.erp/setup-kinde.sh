#!/bin/bash

# Script de configuración rápida de Kinde para el ERP
# Este script crea el archivo .env.local con tus credenciales de Kinde

echo "🚀 Configuración de Autenticación Kinde"
echo "========================================"
echo ""

# Verificar si ya existe .env.local
if [ -f ".env.local" ]; then
    echo "⚠️  El archivo .env.local ya existe."
    read -p "¿Deseas sobrescribirlo? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada."
        exit 1
    fi
fi

# Crear el archivo .env.local
cat > .env.local << 'EOF'
# Kinde Authentication Configuration
KINDE_CLIENT_ID=b0904e67cf0047d9bb1556b53b0f53ca
KINDE_CLIENT_SECRET=5BDl35OiifU9eD52GPg4ouzaHFoZZM5LmKLF05H4Dq8qiuCXO1fy
KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000/login
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/panel
EOF

echo "✅ Archivo .env.local creado exitosamente!"
echo ""
echo "📋 Siguientes pasos:"
echo "   1. Verifica que las credenciales en .env.local sean correctas"
echo "   2. Ejecuta: npm run dev"
echo "   3. Abre: http://localhost:3000"
echo ""
echo "🔐 Tu ERP está listo para usar autenticación con Kinde!"

