#!/bin/bash

echo "🐳 Gestión de Contenedores Docker - Publicidad Vial Imagen"
echo "=========================================================="

case "$1" in
    "build")
        echo "🔨 Construyendo imágenes..."
        docker-compose build
        ;;
    "up")
        echo "🚀 Iniciando contenedores..."
        docker-compose up -d
        echo "✅ Contenedores iniciados:"
        echo "   ERP: http://localhost:3000"
        echo "   Web: http://localhost:3001"
        ;;
    "down")
        echo "🛑 Deteniendo contenedores..."
        docker-compose down
        ;;
    "logs")
        echo "📋 Mostrando logs..."
        docker-compose logs -f
        ;;
    "restart")
        echo "🔄 Reiniciando contenedores..."
        docker-compose restart
        ;;
    "status")
        echo "📊 Estado de contenedores:"
        docker-compose ps
        ;;
    "clean")
        echo "🧹 Limpiando contenedores e imágenes..."
        docker-compose down
        docker system prune -f
        ;;
    *)
        echo "Uso: $0 {build|up|down|logs|restart|status|clean}"
        echo ""
        echo "Comandos disponibles:"
        echo "  build   - Construir las imágenes Docker"
        echo "  up      - Iniciar los contenedores"
        echo "  down    - Detener los contenedores"
        echo "  logs    - Ver logs de los contenedores"
        echo "  restart - Reiniciar los contenedores"
        echo "  status  - Ver estado de los contenedores"
        echo "  clean   - Limpiar contenedores e imágenes"
        ;;
esac
