#!/bin/bash

# Deployment script for Vivid Valid Email Validator
# This script helps with local testing and deployment

set -e

echo "🚀 Vivid Valid Email Validator Deployment Script"
echo "================================================="

# Function to check if nixpacks is installed
check_nixpacks() {
    if ! command -v nixpacks &> /dev/null; then
        echo "❌ nixpacks is not installed. Please install it first:"
        echo "   curl -sSL https://nixpacks.com/install.sh | bash"
        exit 1
    fi
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install -g pnpm
}

# Function to build the application
build_app() {
    echo "🔨 Building application..."
    pnpm install
    npm run build
    cd backend && pnpm install && cd ..
}

# Function to test nixpacks build locally
test_build() {
    echo "🧪 Testing Nixpacks build locally..."
    nixpacks build --dry-run
}

# Function to deploy with nixpacks
deploy() {
    echo "🚢 Deploying with Nixpacks..."
    nixpacks build
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  install    Install dependencies"
    echo "  build      Build the application"
    echo "  test       Test nixpacks build locally"
    echo "  deploy     Deploy with nixpacks"
    echo "  all        Run install, build, test, and deploy"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install    # Install dependencies"
    echo "  $0 all        # Full deployment pipeline"
}

# Main logic
case "${1:-help}" in
    "install")
        check_nixpacks
        install_deps
        ;;
    "build")
        build_app
        ;;
    "test")
        check_nixpacks
        test_build
        ;;
    "deploy")
        check_nixpacks
        install_deps
        build_app
        deploy
        ;;
    "all")
        check_nixpacks
        install_deps
        build_app
        test_build
        deploy
        ;;
    "help"|*)
        show_help
        ;;
esac

echo "✅ Done!"