# Vivid Valid - Docker Deployment Guide

## Overview

Vivid Valid is a comprehensive email validation platform with a React frontend and Node.js backend, containerized for easy deployment.

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 1.29+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Aexawareinfotech-Pvt-Ltd/vivid-valid.git
cd vivid-valid
```

### 2. Deploy with Pre-built Images (Recommended)

```bash
# Use production-ready images from GitHub Container Registry
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Access the Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:3012

## Deployment Options

### Option 1: Production Deployment (Pre-built Images)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Development/Custom Build

```bash
# Build from source
docker-compose up -d
```

### Option 3: Specific Version Deployment

```bash
# Deploy specific version
export VERSION=v1.0.0
docker-compose -f docker-compose.prod.yml up -d
```

## Container Images

### GitHub Container Registry

- Frontend: `ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/frontend:latest`
- Backend: `ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/backend:latest`

### Available Tags

- `latest` - Latest stable release
- `main-{sha}` - Latest development build
- `v{version}` - Specific version release

## Configuration

### Environment Variables

#### Backend

- `NODE_ENV`: Environment (production/development)
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL
- `LOG_LEVEL`: Logging level (info/debug/error)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

#### Frontend

- `NGINX_WORKER_PROCESSES`: Nginx worker processes
- `NGINX_WORKER_CONNECTIONS`: Nginx worker connections

### Health Checks

- Frontend: HTTP check on port 80
- Backend: HTTP check on `/health` endpoint

## Monitoring

### Container Health

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Health check
docker-compose exec backend wget -q --spider http://localhost:3001/health
```

### Resource Usage

```bash
# Monitor resource usage
docker stats
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3
```

### Resource Limits

Production compose file includes resource limits:

- CPU: 1 core max, 0.5 core reserved
- Memory: 512MB max, 256MB reserved

## Security

### Container Security

- Non-root user in backend container
- Minimal base images (Alpine Linux)
- Regular security updates

### Network Security

- Isolated Docker network
- Internal communication only
- No external database dependencies

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Restart services
docker-compose restart
```

#### Port Conflicts

```bash
# Check port usage
netstat -an | grep :8080
netstat -an | grep :3012

# Modify ports in docker-compose.yml
```

#### Image Pull Issues

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images manually
docker pull ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/frontend:latest
docker pull ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/backend:latest
```

## Maintenance

### Updates

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

### Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove images
docker image prune -f

# Remove volumes (careful - data loss)
docker volume prune -f
```

## CI/CD Integration

### GitHub Actions

The repository includes automated workflows:

- Builds and publishes images on push to main
- Updates docker-compose.yml with latest images
- Supports multi-architecture builds

### Manual Build

```bash
# Build frontend
docker build -f Dockerfile.frontend -t vivid-valid-frontend .

# Build backend
cd backend && docker build -t vivid-valid-backend .
```

## Support

### Logs and Debugging

```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# Shell access
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# System resource usage
htop
```

## Backup and Recovery

### Configuration Backup

```bash
# Backup docker-compose files
cp docker-compose.yml docker-compose.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup
```

### Container Backup

```bash
# Export container
docker export vivid-valid-backend > backend-backup.tar
docker export vivid-valid-frontend > frontend-backup.tar
```

## License

This deployment configuration is part of the Vivid Valid project and follows the same licensing terms.
