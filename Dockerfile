FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS backend

WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
COPY backend/ ./

FROM node:20-alpine

RUN apk add --no-cache nginx && \
    rm -rf /var/cache/apk/* && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx /var/lib/nginx/tmp /var/lib/nginx/proxy

COPY --from=frontend /app/dist /var/www/html
COPY --from=backend /app /var/www/backend
COPY nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app && \
    chown -R app:app /var/www/backend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD wget -q --spider http://localhost/health || exit 1

CMD sh -c "export PORT=3000 && node /var/www/backend/server.js & sleep 2 && chown -R root:root /var/lib/nginx && nginx -g 'daemon off;'"
