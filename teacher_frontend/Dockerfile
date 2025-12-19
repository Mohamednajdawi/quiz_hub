# 1. DEPS STAGE
FROM node:20-slim AS deps

# Install common libraries for compatibility
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# --- THE FIX IS HERE ---
# Delete package-lock.json to force fresh dependency resolution for Linux
RUN rm -f package-lock.json
# Force lightningcss to use WASM instead of native binaries during dependency installation
ENV LIGHTNINGCSS_FORCE_WASM=1
RUN npm install 

# 2. BUILDER STAGE
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Telemetry
ENV NEXT_TELEMETRY_DISABLED=1
# Force Tailwind/Next to skip Turbo if possible to avoid binding issues
ENV NEXT_PRIVATE_SKIP_TURBO=1
# Force lightningcss (used by Tailwind v4) to use WASM instead of native binaries
ENV LIGHTNINGCSS_FORCE_WASM=1
# Additional environment variable for npm to target correct platform
ENV npm_config_platform=linux
ENV npm_config_arch=x64

# Run the build
RUN npm run build

# 3. RUNNER STAGE
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]