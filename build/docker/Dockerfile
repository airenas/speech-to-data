FROM node:22-alpine3.19 AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci


# 2. Rebuild the source code only when needed
FROM base AS builder
ARG BUILD_VERSION=0.1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "export const VERSION = '$BUILD_VERSION'" > /app/src/version.ts
RUN npm run build

#############################################################################
FROM nginxinc/nginx-unprivileged:1.27-alpine3.19

COPY LICENSE /licenses/LICENSE-mit

COPY build/docker/entrypoint.sh /docker-entrypoint.d/40-cfg-entrypoint.sh
COPY build/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html


USER root

# RUN chown nginx:nginx /root/entrypoint.sh
RUN chown nginx:nginx /usr/share/nginx/html/*
RUN chown nginx:nginx /usr/share/nginx/html

USER nginx

# CMD ["/root/entrypoint.sh"]

