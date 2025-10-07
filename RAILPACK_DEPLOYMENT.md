# Railpack Deployment Guide

This guide provides detailed instructions for deploying Vivid Valid Email Validator on Railpack.com.

## Prerequisites

- A [Railpack.com](https://railpack.com) account
- GitHub repository with the Vivid Valid code
- Node.js 18+ (for local development)

## Quick Start

### 1. Prepare Your Repository

Ensure your repository contains:

- `railpack.config.js` - Railpack configuration
- `.env.railpack` - Environment variables
- `Dockerfile` and `Dockerfile.frontend` - Container configurations
- `nginx.conf` - Frontend server configuration

### 2. Deploy to Railpack

1. **Login to Railpack**

   ```bash
   # Install Railpack CLI
   npm install -g @railpack/cli

   # Login to your account
   railpack login
   ```

2. **Initialize Railpack**

   ```bash
   # In your project root
   railpack init
   ```

3. **Deploy**
   ```bash
   # Deploy your application
   railpack deploy
   ```

### 3. Configure Environment Variables

In the Railpack dashboard, set these environment variables:

```env
# Backend Configuration
PORT=3001
NODE_ENV=production
SMTP_TIMEOUT=5000
SMTP_FROM_DOMAIN=vivid-valid.railway.app
ENABLE_CACHE=true
CACHE_TTL=300
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Frontend Configuration
VITE_API_BASE_URL=https://your-app-url.railway.app/api

# Security Configuration
FRONTEND_URL=https://your-app-url.railway.app
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Nginx)       │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Static Files  │    │ • Email Validator│    │ • DNS Lookups   │
│ • API Proxy     │    │ • SMTP Testing   │    │ • SMTP Servers  │
│ • SPA Routing   │    │ • Domain Health  │    │ • Blocklists    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Deployment Configuration

### Frontend Configuration

- **Build Tool**: Vite
- **Server**: Nginx
- **Port**: 80 (internal)
- **Static Files**: Served from `/usr/share/nginx/html`
- **API Proxy**: Routes `/api/*` to backend service

### Backend Configuration

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Port**: 3001
- **Health Check**: `/health` endpoint
- **Process Management**: Railpack automatic restarts

## Environment Variables

### Required Variables

| Variable            | Description      | Default       |
| ------------------- | ---------------- | ------------- |
| `PORT`              | Backend port     | 3001          |
| `NODE_ENV`          | Environment      | production    |
| `VITE_API_BASE_URL` | Frontend API URL | Auto-detected |

### Optional Variables

| Variable            | Description             | Default                 |
| ------------------- | ----------------------- | ----------------------- |
| `SMTP_TIMEOUT`      | SMTP connection timeout | 5000ms                  |
| `SMTP_FROM_DOMAIN`  | Domain for SMTP FROM    | vivid-valid.railway.app |
| `ENABLE_CACHE`      | Enable result caching   | true                    |
| `CACHE_TTL`         | Cache time-to-live      | 300s                    |
| `RATE_LIMIT_WINDOW` | Rate limit window       | 900000ms                |
| `RATE_LIMIT_MAX`    | Max requests per window | 100                     |

## Monitoring and Logs

### Health Checks

- **Frontend**: Nginx health check on port 80
- **Backend**: `/health` endpoint on port 3001
- **Automatic**: Railpack monitors service health

### Logs

Access logs through:

- Railpack dashboard
- CLI commands:
  ```bash
  railpack logs
  railpack logs --service backend
  railpack logs --service frontend
  ```

## Scaling and Performance

### Auto-scaling

Railpack automatically scales based on:

- CPU usage
- Memory usage
- Request volume
- Response times

### Performance Optimizations

- **Frontend**: Gzip compression, static asset caching
- **Backend**: Connection pooling, result caching
- **Network**: Load balancing, automatic failover

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**

   - Check environment variables
   - Verify health endpoint is accessible
   - Review backend logs

2. **Frontend Not Loading**

   - Check build process completed
   - Verify Nginx configuration
   - Review frontend logs

3. **API Errors**
   - Check CORS configuration
   - Verify API endpoints
   - Review network logs

### Debug Commands

```bash
# Check deployment status
railpack status

# View logs
railpack logs --follow

# Restart services
railpack restart

# Access shell (if supported)
railpack shell
```

## Custom Domains

1. **Add Custom Domain**

   - In Railpack dashboard: Settings → Domains
   - Add your domain name

2. **Configure DNS**

   - Add CNAME record pointing to `railway.app`
   - Or A record pointing to provided IP

3. **SSL Certificate**
   - Railpack automatically provisions SSL
   - Certificate renewal is automatic

## Rollbacks

### Quick Rollback

```bash
# View deployment history
railpack deployments

# Rollback to previous version
railpack rollback <deployment-id>
```

### Manual Rollback

1. Revert changes in Git
2. Push to repository
3. Railpack will auto-deploy the rollback

## Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Health Checks**: Always implement proper health endpoints
3. **Logging**: Use structured logging for better debugging
4. **Monitoring**: Set up alerts for critical metrics
5. **Security**: Keep dependencies updated

## Support

- **Railpack Documentation**: [docs.railpack.com](https://docs.railpack.com)
- **GitHub Issues**: [Report issues](https://github.com/your-repo/issues)
- **Community**: [Railpack Discord](https://discord.gg/railpack)

---

For more information, visit [railpack.com](https://railpack.com)
