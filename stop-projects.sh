#!/bin/bash

echo "🛑 Deteniendo proyectos Publicidad Vial Imagen"
echo "=============================================="

# Detener ERP
if [ -f "/tmp/ERP.pid" ]; then
    ERP_PID=$(cat /tmp/ERP.pid)
    if kill -0 $ERP_PID 2>/dev/null; then
        kill $ERP_PID
        echo "✅ ERP detenido (PID: $ERP_PID)"
    else
        echo "⚠️  ERP ya estaba detenido"
    fi
    rm -f /tmp/ERP.pid
else
    echo "⚠️  No se encontró PID del ERP"
fi

# Detener Web
if [ -f "/tmp/Web.pid" ]; then
    WEB_PID=$(cat /tmp/Web.pid)
    if kill -0 $WEB_PID 2>/dev/null; then
        kill $WEB_PID
        echo "✅ Web detenido (PID: $WEB_PID)"
    else
        echo "⚠️  Web ya estaba detenido"
    fi
    rm -f /tmp/Web.pid
else
    echo "⚠️  No se encontró PID del Web"
fi

# Limpiar procesos Next.js restantes
pkill -f "next dev" 2>/dev/null && echo "🧹 Procesos Next.js restantes eliminados"

echo ""
echo "✅ Todos los proyectos han sido detenidos"
