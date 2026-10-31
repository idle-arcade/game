# Build context: repository root (see docker-compose.yml).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend ./backend
COPY frontend/package.json ./frontend/package.json
RUN npm ci \
    && npm run build -w @idle-arcade/backend \
    && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/.cache/openapi.json ./backend/.cache/openapi.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/prisma.config.ts ./backend/prisma.config.ts
WORKDIR /app/backend
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node --import ./dist/instrumentation.js dist/index.js"]
