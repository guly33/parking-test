# Stage 1: Build Frontend
FROM node:20 as frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Build Backend
FROM oven/bun:1

WORKDIR /app

COPY backend/package.json .
RUN bun install --production

COPY backend .

# Copy Frontend Build
# Copy to /app_frontend to avoid volume occlusion
COPY --from=frontend-builder /app/dist /app_frontend

CMD ["bun", "index.ts"]
