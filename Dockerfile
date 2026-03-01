FROM node:20-alpine AS backend

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

FROM node:20-alpine

RUN apk add --no-cache nginx && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx

COPY --from=backend /app /var/www/backend
COPY dist/ /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /var/www /var/cache/nginx /var/log/nginx /run/nginx

EXPOSE 80

CMD sh -c "node /var/www/backend/server.js & nginx -g 'daemon off;'"
