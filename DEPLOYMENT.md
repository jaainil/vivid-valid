# Email Verifier Pro - Deployment Guide

This guide provides comprehensive instructions for deploying the Email Verifier Pro application using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have the following installed:

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- Git (for cloning the repository)
- At least 2GB of available RAM
- At least 1GB of free disk space

### Installing Docker

#### Ubuntu/Debian

```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER
```

#### CentOS/RHEL/Fedora

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group
sudo usermod -aG docker $USER
```

#### macOS

```bash
# Install using Homebrew
brew install --cask docker

# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### Windows

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

## Environment Configuration

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/vivid-valid.git
cd vivid-valid
```

### Step 2: Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred text editor:

```bash
nano .env
```

#### Key Environment Variables

**Frontend Configuration:**

- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_NAME`: Application name
- `VITE_MAX_FILE_SIZE`: Maximum file upload size (bytes)
- `VITE_MAX_BULK_EMAILS`: Maximum emails for bulk validation

**Backend Configuration:**

- `NODE_ENV`: Environment (development/production)
- `PORT`: Backend port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

**Rate Limiting:**

- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `SINGLE_EMAIL_RATE_MAX`: Single email validation rate limit
- `BULK_EMAIL_RATE_MAX`: Bulk validation rate limit

**SMTP Configuration:**

- `SMTP_TIMEOUT`: SMTP connection timeout
- `SMTP_FROM_DOMAIN`: Domain for SMTP validation
- `SMTP_PORT`: SMTP port (default: 25)

**Cache Configuration:**

- `DNS_CACHE_TTL`: DNS cache TTL in seconds
- `DISPOSABLE_CACHE_TTL`: Disposable email cache TTL
- `BULK_CACHE_TTL`: Bulk validation cache TTL

**Scoring Configuration:**

- `STRICT_MODE_SCORE_THRESHOLD`: Score threshold for strict mode
- `NORMAL_MODE_SCORE_THRESHOLD`: Score threshold for normal mode
- Various penalty configurations for different validation failures

### Step 3: Make Deployment Script Executable

```bash
chmod +x deploy.sh
```

## Deployment Options

### Option 1: Using the Deployment Script (Recommended)

The deployment script provides an automated way to deploy and manage the application:

```bash
# Development deployment
./deploy.sh

# Production deployment
./deploy.sh --production

# Skip build step (faster restarts)
./deploy.sh --skip-build

# View service status
./deploy.sh --status

# View logs
./deploy.sh --logs

# Stop services
./deploy.sh --stop

# Clean up resources
./deploy.sh --cleanup

# Update production
./deploy.sh --update-prod
```

### Option 2: Manual Docker Compose

#### Development Deployment

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Development Deployment

For development environments, use the standard `docker-compose.yml` file:

```bash
# Start development environment
./deploy.sh --env development

# Or manually
docker-compose up -d --build
```

### Development Features

- Hot reload for frontend
- Debug logging enabled
- Relaxed rate limits
- Less strict validation thresholds
- Health checks enabled

## Production Deployment

For production environments, use the production-optimized configuration:

```bash
# Start production environment
./deploy.sh --production

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

### Production Features

- Optimized resource limits
- Stricter rate limits
- Reduced log verbosity
- Longer cache TTLs
- Security hardening
- Resource constraints

### Production Environment Variables

Ensure you set these variables for production:

```bash
# Application URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api

# Security
NODE_ENV=production
LOG_LEVEL=info

# SMTP Domain
SMTP_FROM_DOMAIN=validator.yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com
```

## Monitoring and Maintenance

### Health Checks

Both frontend and backend services include health checks:

- **Backend Health**: `GET /health`
- **Frontend Health**: HTTP response from the web server

### Viewing Logs

```bash
# View all logs
./deploy.sh --logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Monitoring Resource Usage

```bash
# View container resource usage
docker stats

# View disk usage
docker system df

# View container details
docker-compose ps
```

### Backup and Recovery

#### Backup Configuration

```bash
# Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Backup data volumes (if using external volumes)
docker run --rm -v vivid-valid_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backend-data-$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

#### Recovery

```bash
# Restore environment configuration
cp .env.backup.20231201_120000 .env

# Restore data volumes
docker run --rm -v vivid-valid_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/backend-data-20231201_120000.tar.gz -C /data
```

### Updating the Application

#### Development Updates

```bash
# Pull latest changes
git pull origin main

# Restart with new build
./deploy.sh --skip-build
```

#### Production Updates

```bash
# Automated production update
./deploy.sh --update-prod

# Or manual update
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

**Problem**: Services fail to start due to port conflicts.

**Solution**:

```bash
# Check what's using the ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :8080

# Change ports in .env file
PORT=3002
FRONTEND_PORT=8081
```

#### 2. Permission Issues

**Problem**: Docker permission denied errors.

**Solution**:

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

#### 3. Out of Memory

**Problem**: Containers crash due to insufficient memory.

**Solution**:

```bash
# Check available memory
free -h

# Increase Docker memory allocation in Docker Desktop
# Or reduce resource limits in docker-compose.prod.yml
```

#### 4. Health Check Failures

**Problem**: Services show as unhealthy.

**Solution**:

```bash
# Check service logs
./deploy.sh --logs

# Check health endpoint directly
curl http://localhost:3001/health

# Restart services
docker-compose restart
```

#### 5. CORS Errors

**Problem**: Frontend cannot connect to backend.

**Solution**:

```bash
# Check CORS configuration in .env
CORS_ORIGIN=http://localhost:8080
FRONTEND_URL=http://localhost:8080

# Ensure backend URL is correct in frontend
VITE_API_BASE_URL=http://localhost:3001/api
```

### Debug Mode

For detailed debugging, enable debug logging:

```bash
# Set debug log level
echo "LOG_LEVEL=debug" >> .env

# Restart services
./deploy.sh --skip-build

# View detailed logs
./deploy.sh --logs
```

### Performance Tuning

#### Backend Optimization

```bash
# Adjust worker processes
# In docker-compose.prod.yml, add:
environment:
  - UV_THREADPOOL_SIZE=128
```

#### Frontend Optimization

```bash
# Enable gzip compression
# In frontend Dockerfile, add nginx configuration
```

### Security Considerations

1. **Change Default Ports**: Avoid using default ports in production
2. **Use HTTPS**: Configure SSL/TLS termination
3. **Rate Limiting**: Adjust rate limits based on your needs
4. **Network Isolation**: Use Docker networks to isolate services
5. **Regular Updates**: Keep Docker images and dependencies updated

### Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs for error messages
2. Verify your environment configuration
3. Ensure all prerequisites are met
4. Check the GitHub issues page for known problems
5. Create a new issue with detailed information about your problem

## Advanced Configuration

### Custom Networks

For advanced networking, you can create custom Docker networks:

```yaml
networks:
  vivid-valid-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### External Volumes

For persistent data storage, use external volumes:

```yaml
volumes:
  backend-data:
    external: true
```

### Environment-Specific Compose Files

Create additional compose files for different environments:

```bash
# Staging environment
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Testing environment
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```
