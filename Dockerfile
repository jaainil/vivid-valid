# Stage 1: Build React frontend
FROM node:20-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Install backend production dependencies
FROM node:20-alpine AS backend

WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/ ./

# Stage 3: Final image — Node.js only, no nginx
FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY --from=backend /app ./

# Copy built React frontend into backend's public directory
COPY --from=frontend /app/dist ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
