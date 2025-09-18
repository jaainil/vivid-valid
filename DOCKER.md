# Vivid Valid - Docker Containerization

## Overview

This document provides comprehensive information about the Docker containerization setup for Vivid Valid, including build processes, deployment strategies, and container registry management.

## Container Architecture

### Frontend Container

- **Base Image**: Node.js 18 Alpine (build stage) → Nginx Alpine (production)
- **Port**: 80 (HTTP)
- **Build Context**: Root directory
- **Key Features**:
  - Multi-stage build for optimized image size
  - Nginx serving static files
  - Health checks enabled
  - Non-root execution

### Backend Container

- **Base Image**: Node.js 18 Alpine
- **Port**: 3001 (HTTP)
- **Build Context**: `./backend` directory
- **Key Features**:
  - Production-optimized with `npm ci --only=production`
  - Non-root user execution
  - Built-in rate limiting
  - Health check endpoint at `/health`

## Docker Compose Files

### docker-compose.yml (Development/Build)

- Builds from local source code
- Includes health checks
- Environment variables for development
- Suitable for local development and custom builds

### docker-compose.prod.yml (Production)

- Uses pre-built images from GitHub Container Registry
- Resource limits and reservations
- Production-ready configuration
- Optimized for deployment

## GitHub Container Registry

### Image Names

- Frontend: `ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/frontend`
- Backend: `ghcr.io/aexawareinfotech-pvt-ltd/vivid-valid/backend`

### Available Tags

- `latest`: Latest stable release
- `main-{sha}`: Development builds from main branch
- `v{version}`: Versioned releases (e.g., `v1.0.0`)
- `pr-{number}`: Pull request builds

### Authentication

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Build Process

### Local Build

```bash
# Build frontend
docker build -f Dockerfile.frontend -t vivid-valid-frontend .

# Build backend
cd backend && docker build -t vivid-valid-backend .
```

### Automated Build (GitHub Actions)

The repository includes automated workflows that:

1. Build images on push to main/develop
2. Publish to GitHub Container Registry
3. Update docker-compose.yml with latest images
4. Support multi-architecture builds

## Deployment Strategies

### 1. Production Deployment (Recommended)

```bash
# Use pre-built images
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Development Deployment

```bash
# Build from source
docker-compose up -d
```

### 3. Hybrid Deployment

```bash
# Mix local builds and registry images
# Modify docker-compose.yml as needed
docker-compose up -d
```

## Health Monitoring

### Health Check Endpoints

- Frontend: `http://localhost:8080` (HTTP 200 response)
- Backend: `http://localhost:3012/health` (JSON response)

### Health Check Configuration

```yaml
healthcheck:
  test:
    ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Security Features

### Container Security

- **Non-root execution**: Backend runs as `backend` user (UID 1001)
- **Minimal base images**: Alpine Linux for reduced attack surface
- **Security headers**: Helmet.js for backend security
- **Rate limiting**: Built-in request rate limiting

### Network Security

- **Isolated networks**: Dedicated Docker network for services
- **Internal communication**: Services communicate over internal network
- **Port exposure**: Only necessary ports exposed

## Performance Optimization

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: "1"
      memory: 512M
    reservations:
      cpus: "0.5"
      memory: 256M
```

### Build Optimization

- Multi-stage builds for smaller images
- Layer caching optimization
- Production dependencies only in final images

## Environment Configuration

### Backend Environment Variables

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - FRONTEND_URL=http://localhost:8080
  - BACKEND_URL=http://localhost:3012
  - LOG_LEVEL=info
  - RATE_LIMIT_WINDOW_MS=900000
  - RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

```yaml
environment:
  - NGINX_WORKER_PROCESSES=auto
  - NGINX_WORKER_CONNECTIONS=1024
```

## Troubleshooting

### Container Issues

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Shell access
docker-compose exec [service-name] sh

# Resource usage
docker stats
```

### Common Problems

1. **Port conflicts**: Check if ports 8080 and 3012 are available
2. **Image pull issues**: Verify GitHub Container Registry authentication
3. **Build failures**: Check Node.js version compatibility
4. **Health check failures**: Verify service startup and network connectivity

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

# Remove unused images
docker image prune -f

# Remove unused volumes (careful - data loss)
docker volume prune -f
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/build-and-publish.yml` workflow:

- Triggers on push to main/develop and PRs
- Builds and publishes both frontend and backend images
- Updates docker-compose.yml with latest image tags
- Supports semantic versioning

### Manual Trigger

```bash
# Trigger workflow manually via GitHub UI
# or push a tag to trigger release build
git tag v1.0.0
git push origin v1.0.0
```

## Monitoring and Logging

### Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f -t
```

### Health Monitoring

```bash
# Check health endpoint
curl http://localhost:3012/health

# Monitor container health
docker-compose ps

# Resource monitoring
docker stats
```

## Backup and Recovery

### Configuration Backup

```bash
# Backup compose files
cp docker-compose.yml docker-compose.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup
```

### Container Backup

```bash
# Export running container
docker export container-name > backup.tar

# Import backup
docker import backup.tar
```

## Support and Documentation

### Internal Documentation

- `DEPLOYMENT.md`: Comprehensive deployment guide
- `README.md`: Project overview and setup
- `.github/workflows/`: CI/CD configuration

### External Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## License

This Docker configuration is part of the Vivid Valid project and follows the same licensing terms.
