# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build.
COPY . .
RUN bun run build

# Runtime stage
FROM oven/bun:slim AS runtime

WORKDIR /app

# Copy build output and production dependencies.
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lock ./
COPY --from=build /app/scripts ./scripts

RUN bun install --production --frozen-lockfile

# Create data directory for SQLite.
RUN mkdir -p /data

ENV NODE_ENV=production
ENV STUDYBUB_DB_PATH=/data/studybub.db

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
