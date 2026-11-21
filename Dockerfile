# Production image for OverlayLive (Next.js + PostgreSQL)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Create/update the database tables, then start the app.
CMD ["sh", "-c", "npx drizzle-kit push --config=drizzle.prod.config.ts --force && npm run start -- -p ${PORT:-3000}"]
