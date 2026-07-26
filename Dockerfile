# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Runtime stage
FROM oven/bun:slim AS runtime

WORKDIR /app

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lock ./
COPY --from=build /app/scripts ./scripts

RUN bun install --production --frozen-lockfile

RUN mkdir -p /data

ENV NODE_ENV=production
ENV STUDYBUB_DB_PATH=/data/studybub.db

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
