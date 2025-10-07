# Railway/Railpack.com Deployment Guide

This guide provides step-by-step instructions for deploying the Vivid Valid Email Validator to Railway (railpack.com).

## 📋 Prerequisites

- Railway account (https://railway.app or railpack.com)
- GitHub account with this repository
- Railway CLI (optional, for local deployment)

## 🏗️ Architecture

The application consists of two services:

1. **Frontend** - React/Vite application (port 8080 by default)
2. **Backend** - Node.js/Express API (port 3001 by default)

## 🚀 Deployment Steps

### Method 1: Deploy via Railway Dashboard (Recommended)

#### Step 1: Deploy Backend Service

1. Login to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Configure the backend service:

   - **Root Directory**: `/backend`
   - **Build Command**: `npm ci --only=production`
   - **Start Command**: `npm start`
   - **Watch Paths**: `/backend/**`

6. Set environment variables:

   ```
   NODE_ENV=production
   PORT=${{PORT}}
   FRONTEND_URL=${{FRONTEND_SERVICE_URL}}
   LOG_LEVEL=info
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

7. Generate a public domain for the backend service
8. Note the backend URL (e.g., `https://vivid-valid-backend.up.railway.app`)

#### Step 2: Deploy Frontend Service

1. In the same project, click "New Service"
2. Select "Deploy from GitHub repo" (same repository)
3. Configure the frontend service:

   - **Root Directory**: `/` (project root)
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm run build`
   - **Start Command**: `pnpm run preview --host 0.0.0.0 --port $PORT`
   - **Watch Paths**: `/src/**`, `/public/**`, `package.json`, `vite.config.ts`

4. Set environment variables:

   ```
   NODE_ENV=production
   VITE_API_BASE_URL=${{BACKEND_SERVICE_URL}}/api
   ```

5. Generate a public domain for the frontend service

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy backend
cd backend
railway up --service backend

# Set backend environment variables
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://your-frontend.railway.app

# Deploy frontend
cd ..
railway up --service frontend

# Set frontend environment variables
railway variables set VITE_API_BASE_URL=https://your-backend.railway.app/api
```

### Method 3: Deploy with Nixpacks (Automatic)

Railway automatically detects and uses the `nixpacks.toml` configuration files:

- **Frontend**: Uses `/nixpacks.toml`
- **Backend**: Uses `/backend/nixpacks.toml`

The configuration is optimized for Railway deployment with:

- Node.js 18.x runtime
- Production dependency installation
- Optimized build process
- Port configuration via `$PORT` environment variable

## 🔧 Configuration Files

### Frontend Configuration (`nixpacks.toml`)

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm run build"]

[start]
cmd = "pnpm run preview --host 0.0.0.0 --port $PORT"
```

### Backend Configuration (`backend/nixpacks.toml`)

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm ci --only=production"]

[start]
cmd = "npm start"
```

### Railway Configuration (`railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🔐 Environment Variables

### Backend Required Variables

| Variable                  | Description                            | Example                     |
| ------------------------- | -------------------------------------- | --------------------------- |
| `NODE_ENV`                | Environment mode                       | `production`                |
| `PORT`                    | Server port (auto-provided by Railway) | `${{PORT}}`                 |
| `FRONTEND_URL`            | Frontend service URL                   | `${{FRONTEND_SERVICE_URL}}` |
| `LOG_LEVEL`               | Logging level                          | `info`                      |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window in ms                | `900000`                    |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window                | `100`                       |

### Frontend Required Variables

| Variable            | Description      | Example                        |
| ------------------- | ---------------- | ------------------------------ |
| `NODE_ENV`          | Environment mode | `production`                   |
| `VITE_API_BASE_URL` | Backend API URL  | `${{BACKEND_SERVICE_URL}}/api` |

## 📊 Service Configuration

### Backend Service

- **Port**: Railway auto-assigns (uses `$PORT`)
- **Health Check**: `/health` endpoint
- **Memory**: 512MB (recommended)
- **Replicas**: 1 (can scale horizontally)

### Frontend Service

- **Port**: Railway auto-assigns (uses `$PORT`)
- **Memory**: 256MB (recommended)
- **Replicas**: 1 (can scale horizontally)

## 🔍 Health Checks

### Backend Health Endpoint

```bash
GET https://your-backend.railway.app/health
```

Expected Response:

```json
{
  "status": "OK",
  "timestamp": "2025-10-07T04:33:06.482Z",
  "service": "Vivid Valid Email Validator"
}
```

### Frontend Health Check

Access the frontend URL and verify the application loads correctly.

## 🚨 Troubleshooting

### Common Issues

1. **Backend not accessible**

   - Check if the backend service has a public domain
   - Verify environment variables are set correctly
   - Check logs: `railway logs --service backend`

2. **Frontend can't connect to backend**

   - Verify `VITE_API_BASE_URL` is set correctly
   - Ensure backend URL includes `/api` suffix
   - Check CORS configuration in backend

3. **Build failures**

   - Check build logs in Railway dashboard
   - Verify `nixpacks.toml` is in correct location
   - Ensure all dependencies are in `package.json`

4. **Port binding errors**
   - Ensure services use `$PORT` environment variable
   - Check vite.config.ts preview port configuration
   - Verify backend server.js uses `process.env.PORT`

### Debug Commands

```bash
# View logs
railway logs --service backend
railway logs --service frontend

# Check environment variables
railway variables --service backend
railway variables --service frontend

# Restart services
railway up --service backend
railway up --service frontend

# Check service status
railway status
```

## 🔄 CI/CD Integration

### GitHub Actions (Optional)

The existing CI/CD workflows can be adapted for Railway:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy Backend
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy Frontend
        run: railway up --service frontend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📈 Monitoring

1. **Railway Dashboard**: Monitor CPU, memory, and network usage
2. **Logs**: Use Railway logs for debugging
3. **Health Checks**: Monitor `/health` endpoint
4. **Alerts**: Configure Railway alerts for downtime

## 🔒 Security Best Practices

1. Set appropriate CORS origins in backend
2. Use environment variables for sensitive data
3. Enable rate limiting (already configured)
4. Use HTTPS for all communications (Railway provides this)
5. Regularly update dependencies

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Nixpacks Documentation](https://nixpacks.com)
- [Vite Production Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 💡 Tips for Optimal Performance

1. **Enable Railway caching** for faster builds
2. **Use production builds** with minification enabled
3. **Configure CDN** for static assets (Railway provides this)
4. **Set appropriate memory limits** based on usage
5. **Monitor response times** and optimize API calls
6. **Use Railway metrics** for performance insights

## 🎯 Success Checklist

- [ ] Backend service deployed and accessible
- [ ] Frontend service deployed and accessible
- [ ] Environment variables configured correctly
- [ ] CORS properly configured
- [ ] Health check endpoint responding
- [ ] Frontend can communicate with backend
- [ ] Email validation working end-to-end
- [ ] Logs show no critical errors
- [ ] Public domains configured
- [ ] Rate limiting active

---

**Need Help?** Check Railway's status page or contact Railway support for platform-specific issues.
