# ── Base: Node 20 Alpine + pnpm ──────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Deps: instala dependencias sin ejecutar scripts ──────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia manifest + lockfile + schema de Prisma (necesario para postinstall)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# --ignore-scripts evita que prisma generate falle por rutas relativas;
# se ejecutará de forma explícita en el stage builder.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Builder: genera el cliente Prisma y construye Next.js ────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# 1. Genera el cliente Prisma en src/generated/client
# 2. Build de producción Next.js (standalone)
RUN pnpm run gen && pnpm run build

# ── Runner: imagen de producción mínima ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Librerías necesarias para los binarios de Prisma en Alpine
RUN apk add --no-cache libc6-compat openssl

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instala la CLI de Prisma globalmente para ejecutar migraciones al arrancar.
# Se fija la versión mayor para coincidir con el cliente generado.
RUN npm install -g prisma@6

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

# Salida standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Schema + migraciones de Prisma (necesarios en runtime para migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Cliente Prisma generado
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Directorio persistente para archivos de proyectos
RUN mkdir -p /app/storage/projects && chown -R nextjs:nodejs /app/storage

# Script de arranque
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER root

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["/docker-entrypoint.sh"]
