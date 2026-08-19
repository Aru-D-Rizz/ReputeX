# =========================================================
# Stage 1: Build & Prune Dependencies
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Prune devDependencies for production
RUN npm prune --production

# =========================================================
# Stage 2: Minimal Production Runtime
# =========================================================
FROM node:20-alpine AS runner

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Security: Create non-root system user and group
RUN addgroup -S reputex && adduser -S reputex -G reputex

# Copy pruned node_modules and application files from builder stage
COPY --from=builder --chown=reputex:reputex /app/package*.json ./
COPY --from=builder --chown=reputex:reputex /app/node_modules ./node_modules
COPY --from=builder --chown=reputex:reputex /app/data ./data
COPY --from=builder --chown=reputex:reputex /app/engine ./engine
COPY --from=builder --chown=reputex:reputex /app/services ./services
COPY --from=builder --chown=reputex:reputex /app/server.js ./server.js

# Switch to non-root user
USER reputex

# Expose backend API port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Start ReputeX API server
CMD ["node", "server.js"]
