# 1. DEPS STAGE
# Use node:20-slim for better compatibility with native modules (fixes the musl error)
FROM node:20-slim AS deps

# Install necessary build tools (needed for some npm packages)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on lockfile
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

# 2. BUILDER STAGE
FROM node:20-slim AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Telemetry and Turbopack (forces Webpack, which is more stable for Docker builds)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_SKIP_TURBO=1

# Run the build
RUN npm run build

# 3. RUNNER STAGE
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone build and static files
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]