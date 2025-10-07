#!/bin/bash

# Vivid Valid Email Validator - Deployment Script
# This script helps deploy the application with Docker

set -e

echo "🚀 Vivid Valid Email Validator - Deployment Script"
echo "================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to cleanup containers
cleanup() {
    echo "🧹 Cleaning up existing containers..."
    docker-compose down 2>/dev/null || true
}

# Function to build and deploy
deploy() {
    echo "🔨 Building and deploying application..."

    # Build the application
    if command -v docker-compose &> /dev/null; then
        docker-compose build --no-cache
        docker-compose up -d
    else
        docker compose build --no-cache
        docker compose up -d
    fi

    echo "✅ Application deployed successfully!"
}

# Function to check deployment status
check_status() {
    echo "📊 Checking deployment status..."

    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi

    echo ""
    echo "🔍 Health check:"
    sleep 5
    curl -f "http://localhost:3001/health" && echo "✅ Backend is healthy" || echo "❌ Backend health check failed"
    curl -f "http://localhost:3000" && echo "✅ Frontend is accessible" || echo "❌ Frontend is not accessible"
}

# Function to view logs
view_logs() {
    echo "📋 Showing application logs..."
    if command -v docker-compose &> /dev/null; then
        docker-compose logs -f vivid-valid
    else
        docker compose logs -f vivid-valid
    fi
}

# Main menu
case "${1:-deploy}" in
    "deploy")
        cleanup
        deploy
        check_status
        ;;
    "status")
        check_status
        ;;
    "logs")
        view_logs
        ;;
    "restart")
        echo "🔄 Restarting application..."
        if command -v docker-compose &> /dev/null; then
            docker-compose restart
        else
            docker compose restart
        fi
        check_status
        ;;
    "stop")
        echo "⏹️  Stopping application..."
        cleanup
        echo "✅ Application stopped"
        ;;
    "cleanup")
        cleanup
        echo "✅ Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|restart|stop|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and deploy the application"
        echo "  status   - Check deployment status and health"
        echo "  logs     - View application logs"
        echo "  restart  - Restart the application"
        echo "  stop     - Stop the application"
        echo "  cleanup  - Remove all containers and images"
        echo ""
        echo "Examples:"
        echo "  $0 deploy    # Deploy the application"
        echo "  $0 status    # Check if it's running"
        echo "  $0 logs      # View logs"
        exit 1
        ;;
esac

echo ""
echo "🎉 Operation completed!"