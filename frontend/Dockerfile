# Build context: repository root (see docker-compose.yml).
# Backend sources are needed: the frontend type-checks against the backend's AppRouter.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend ./backend
COPY frontend ./frontend
RUN npm ci
RUN npm run build -w @idle-arcade/frontend

FROM nginx:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
