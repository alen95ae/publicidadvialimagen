#!/bin/bash

echo "🚀 Iniciando proyectos Publicidad Vial Imagen"
echo "============================================="

# Cargar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

echo "📋 Usando Node $(node -v) y npm $(npm -v)"
echo ""

# Función para iniciar proyecto en background
start_project() {
    local project_name=$1
    local project_path=$2
    local port=$3
    local command=$4
    
    echo "🔧 Iniciando $project_name en puerto $port..."
    cd "$project_path"
    $command &
    local pid=$!
    echo "✅ $project_name iniciado (PID: $pid) en http://localhost:$port"
    echo $pid > "/tmp/${project_name}.pid"
}

# Iniciar ERP
start_project "ERP" "/Users/alen_ae/Desktop/publicidadvialimagen/publicidadvialimagen.erp" "3000" "npm run dev"

# Esperar un momento
sleep 2

# Iniciar Web
start_project "Web" "/Users/alen_ae/Desktop/publicidadvialimagen/publicidadvialimagen.com" "3001" "npm run dev:3001"

echo ""
echo "🎉 Ambos proyectos iniciados correctamente!"
echo "   ERP: http://localhost:3000"
echo "   Web: http://localhost:3001"
echo ""
echo "Para detener los proyectos, ejecuta: ./stop-projects.sh"
echo "Para ver logs: tail -f /tmp/ERP.log /tmp/Web.log"
