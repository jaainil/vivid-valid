#!/bin/bash

# Railway Deployment Script for Vivid Valid Email Validator
# This script helps deploy the application to Railway (railpack.com)

set -e

echo "🚀 Railway Deployment Helper"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI is installed"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo "✅ Logged in to Railway"

# Initialize project if not already initialized
if [ ! -f "railway.json" ]; then
    echo "❌ railway.json not found. Please run this from the project root."
    exit 1
fi

echo "📋 Deployment Options:"
echo "1. Deploy Backend Service"
echo "2. Deploy Frontend Service"
echo "3. Deploy Both Services"
echo "4. Set Environment Variables"
echo "5. View Logs"
echo "6. Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🔧 Deploying Backend Service..."
        cd backend
        railway up --service backend
        echo "✅ Backend deployed successfully!"
        ;;
    2)
        echo "🎨 Deploying Frontend Service..."
        railway up --service frontend
        echo "✅ Frontend deployed successfully!"
        ;;
    3)
        echo "🔧 Deploying Backend Service..."
        cd backend
        railway up --service backend
        cd ..
        echo "🎨 Deploying Frontend Service..."
        railway up --service frontend
        echo "✅ Both services deployed successfully!"
        ;;
    4)
        echo "⚙️  Setting Environment Variables..."
        echo ""
        echo "For Backend, set these variables in Railway dashboard:"
        echo "  - NODE_ENV=production"
        echo "  - PORT=\${{PORT}}"
        echo "  - FRONTEND_URL=\${{FRONTEND_SERVICE_URL}}"
        echo "  - LOG_LEVEL=info"
        echo "  - RATE_LIMIT_WINDOW_MS=900000"
        echo "  - RATE_LIMIT_MAX_REQUESTS=100"
        echo ""
        echo "For Frontend, set these variables in Railway dashboard:"
        echo "  - NODE_ENV=production"
        echo "  - VITE_API_BASE_URL=\${{BACKEND_SERVICE_URL}}/api"
        echo ""
        echo "Visit: https://railway.app/dashboard"
        ;;
    5)
        echo "📊 View Logs:"
        echo "1. Backend Logs"
        echo "2. Frontend Logs"
        read -p "Enter choice (1-2): " log_choice
        
        if [ "$log_choice" = "1" ]; then
            railway logs --service backend
        elif [ "$log_choice" = "2" ]; then
            railway logs --service frontend
        fi
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "✨ Deployment complete! Check Railway dashboard for service URLs."
echo "📚 See RAILWAY_DEPLOYMENT.md for detailed documentation."