@echo off
REM Email Verifier Pro Deployment Script for Windows
REM This script helps deploy the application using Docker Compose

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=development
set COMPOSE_FILE=docker-compose.yml
set SKIP_BUILD=false

REM Function to print colored output
:print_info
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Function to check if .env file exists
:check_env_file
if not exist ".env" (
    call :print_warning ".env file not found. Creating from .env.example..."
    copy ".env.example" ".env" >nul
    call :print_warning "Please edit .env file with your configuration before running the application again."
    exit /b 1
)
goto :eof

REM Function to validate environment
:validate_environment
call :print_info "Validating environment..."

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not installed. Please install Docker first."
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)

REM Check if .env file exists
call :check_env_file

call :print_info "Environment validation completed successfully."
goto :eof

REM Function to build and start services
:deploy_services
call :print_info "Starting deployment with environment: %ENVIRONMENT%"

if "%SKIP_BUILD%"=="false" (
    call :print_info "Building Docker images..."
    docker-compose -f %COMPOSE_FILE% build --no-cache
)

call :print_info "Starting services..."
docker-compose -f %COMPOSE_FILE% up -d

call :print_info "Waiting for services to be healthy..."
timeout /t 10 /nobreak >nul

call :print_info "Deployment completed successfully!"
goto :eof

REM Function to show service status
:show_status
call :print_info "Service Status:"
docker-compose -f %COMPOSE_FILE% ps

call :print_info ""
call :print_info "Service Logs (last 20 lines):"
docker-compose -f %COMPOSE_FILE% logs --tail=20
goto :eof

REM Function to stop services
:stop_services
call :print_info "Stopping services..."
docker-compose -f %COMPOSE_FILE% down
call :print_info "Services stopped successfully."
goto :eof

REM Function to clean up
:cleanup
call :print_info "Cleaning up Docker resources..."
docker-compose -f %COMPOSE_FILE% down -v --remove-orphans
docker system prune -f
call :print_info "Cleanup completed."
goto :eof

REM Parse command line arguments
if "%1"=="--production" (
    set ENVIRONMENT=production
    set COMPOSE_FILE=docker-compose.prod.yml
    shift
) else if "%1"=="--skip-build" (
    set SKIP_BUILD=true
    shift
) else if "%1"=="--status" (
    call :show_status
    exit /b 0
) else if "%1"=="--stop" (
    call :stop_services
    exit /b 0
) else if "%1"=="--cleanup" (
    call :cleanup
    exit /b 0
) else if "%1"=="--help" (
    echo Usage: %0 [OPTIONS]
    echo.
    echo Options:
    echo   --production         Use production configuration
    echo   --skip-build         Skip Docker build step
    echo   --status             Show service status
    echo   --stop               Stop all services
    echo   --cleanup            Clean up Docker resources
    echo   --help               Show this help message
    exit /b 0
)

REM Main execution
call :validate_environment
call :deploy_services
call :show_status

call :print_info ""
call :print_info "🚀 Email Verifier Pro is now running!"
call :print_info "Frontend: http://localhost:8080"
call :print_info "Backend: http://localhost:3001"
call :print_info "API Health: http://localhost:3001/health"
call :print_info ""
call :print_info "Use '%0 --status' to view service status"
call :print_info "Use '%0 --stop' to stop services"
call :print_info "Use '%0 --cleanup' to clean up resources"

endlocal