FROM node:20-alpine AS backend

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY backend/ ./

FROM node:20-alpine

RUN apk add --no-cache nginx && \
    rm -rf /var/cache/apk/* && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx /var/lib/nginx/tmp /var/lib/nginx/proxy

COPY --from=backend /app /var/www/backend
COPY dist/ /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app && \
    chown -R app:app /var/www/backend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

CMD sh -c "chown -R root:root /var/lib/nginx && node /var/www/backend/server.js & nginx -g 'daemon off;'"
