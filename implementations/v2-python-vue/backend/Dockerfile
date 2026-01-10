# Stage 1: Build Frontend
FROM node:20 as frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Build Backend
FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

# Copy Frontend Build
# Vite builds Vue to 'dist' by default. We'll copy to /app_frontend to avoid volume occlusion.
COPY --from=frontend-builder /app/dist /app_frontend

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
