# Production image for Tikley (Next.js + PostgreSQL)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build /app ./
EXPOSE 3000

# Database schema changes must be reviewed and applied separately.
# Never run drizzle-kit push automatically during service startup.
CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000}"]
