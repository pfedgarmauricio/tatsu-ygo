# Multi-stage build for tatsu-ygo
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:25-alpine

WORKDIR /app

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including tsx for running TypeScript)
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server and source code
COPY server ./server
COPY src ./src
COPY tsconfig.json ./

# Create data directory for tournament storage
RUN mkdir -p data

# Expose port 3001 for API
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/tournaments || exit 1

# Use dumb-init to run the server with tsx
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "tsx", "server/index.ts"]
