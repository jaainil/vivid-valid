/**
 * Railpack configuration for Vivid Valid Email Validator
 * This configuration optimizes the application for deployment on Railpack.com
 */

export default {
  // Application name
  name: "vivid-valid",

  // Build configuration
  build: {
    // Frontend build configuration
    frontend: {
      // Build command
      command: "npm run build",
      // Output directory
      outputDirectory: "dist",
      // Node.js version
      nodeVersion: "18",
      // Environment variables
      env: {
        NODE_ENV: "production",
      },
    },

    // Backend build configuration
    backend: {
      // Build command
      command: "cd backend && npm install",
      // Start command
      startCommand: "cd backend && npm start",
      // Node.js version
      nodeVersion: "18",
      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: "$PORT",
      },
    },
  },

  // Deployment configuration
  deployment: {
    // Health check endpoint
    healthCheckPath: "/health",
    // Port configuration
    port: 3001,
    // Automatic deployments
    autoDeploy: true,
    // Environment variables
    env: {
      // Frontend URL
      VITE_API_BASE_URL: "$RAILWAY_PUBLIC_URL/api",
      // Backend configuration
      PORT: "$PORT",
      NODE_ENV: "production",
      SMTP_TIMEOUT: "5000",
      SMTP_FROM_DOMAIN: "vivid-valid.railway.app",
      ENABLE_CACHE: "true",
      CACHE_TTL: "300",
      RATE_LIMIT_WINDOW: "900000",
      RATE_LIMIT_MAX: "100",
    },
  },

  // Routes configuration
  routes: [
    // Frontend routes (served from dist)
    {
      src: "/(.*)",
      dest: "/dist/$1",
    },
    // Backend API routes
    {
      src: "/api/(.*)",
      dest: "http://localhost:3001/api/$1",
    },
    // Health check
    {
      src: "/health",
      dest: "http://localhost:3001/health",
    },
  ],

  // Optimization settings
  optimization: {
    // Enable compression
    compression: true,
    // Enable caching
    caching: true,
    // Minify assets
    minify: true,
    // Bundle optimization
    bundle: true,
  },

  // Plugins
  plugins: [
    // Node.js plugin
    "@railpack/node",
    // Static file serving
    "@railpack/static",
  ],
};
