FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY astro.config.mjs tsconfig.json ./
COPY src/ src/

RUN npm run build && npm prune --omit=dev

# ─── Production ──────────────────────────────────────────────────────────────

FROM node:24-alpine

WORKDIR /app

COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/dist/ dist/
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server/entry.mjs"]
