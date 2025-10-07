#!/bin/bash

# Email Verifier Pro Deployment Script
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
COMPOSE_FILE="docker-compose.yml"
SKIP_BUILD=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before running the application again."
        exit 1
    fi
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    check_env_file
    
    print_status "Environment validation completed successfully."
}

# Function to build and start services
deploy_services() {
    print_status "Starting deployment with environment: $ENVIRONMENT"
    
    if [ "$SKIP_BUILD" = false ]; then
        print_status "Building Docker images..."
        docker-compose -f $COMPOSE_FILE build --no-cache
    fi
    
    print_status "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if docker-compose -f $COMPOSE_FILE ps | grep -q "unhealthy\|Up (healthy)"; then
        print_status "Services are starting up..."
    fi
    
    print_status "Deployment completed successfully!"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    docker-compose -f $COMPOSE_FILE ps
    
    print_status "\nService Logs (last 20 lines):"
    docker-compose -f $COMPOSE_FILE logs --tail=20
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    print_status "Services stopped successfully."
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose -f $COMPOSE_FILE down -v --remove-orphans
    docker system prune -f
    print_status "Cleanup completed."
}

# Function to show logs
show_logs() {
    docker-compose -f $COMPOSE_FILE logs -f
}

# Function to update production environment
update_production() {
    print_status "Updating production environment..."
    
    # Backup current .env
    if [ -f ".env" ]; then
        cp .env .env.backup
        print_status "Current .env file backed up as .env.backup"
    fi
    
    # Pull latest changes
    print_status "Pulling latest changes..."
    git pull origin main
    
    # Deploy with production compose file
    COMPOSE_FILE="docker-compose.prod.yml"
    deploy_services
    
    print_status "Production update completed!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --production)
            ENVIRONMENT="production"
            COMPOSE_FILE="docker-compose.prod.yml"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --status)
            show_status
            exit 0
            ;;
        --stop)
            stop_services
            exit 0
            ;;
        --cleanup)
            cleanup
            exit 0
            ;;
        --logs)
            show_logs
            exit 0
            ;;
        --update-prod)
            update_production
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env ENVIRONMENT     Set environment (development|production)"
            echo "  --production         Use production configuration"
            echo "  --skip-build         Skip Docker build step"
            echo "  --status             Show service status"
            echo "  --stop               Stop all services"
            echo "  --cleanup            Clean up Docker resources"
            echo "  --logs               Show service logs"
            echo "  --update-prod        Update production environment"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for available options."
            exit 1
            ;;
    esac
done

# Set compose file based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Main execution
validate_environment
deploy_services
show_status

print_status "\n🚀 Email Verifier Pro is now running!"
print_status "Frontend: http://localhost:${FRONTEND_PORT:-8080}"
print_status "Backend: http://localhost:${PORT:-3001}"
print_status "API Health: http://localhost:${PORT:-3001}/health"
print_status "\nUse '$0 --logs' to view logs"
print_status "Use '$0 --stop' to stop services"
print_status "Use '$0 --cleanup' to clean up resources"