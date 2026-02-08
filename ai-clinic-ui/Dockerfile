# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copy source
COPY . .

# Build Next.js app
RUN npm run build

# Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what is needed to run
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --legacy-peer-deps; else npm install --omit=dev --legacy-peer-deps; fi
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
