FROM node:25-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk add --no-cache git && npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Caddy serves the pre-compressed .br files directly, which nginx can't do without a module.
FROM caddy:2-alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv
RUN chmod -R o+rX /srv
USER nobody
EXPOSE 8080
