# Multi-stage Dockerfile for Duitin Full-Stack Application

# --- Stage 1: Build React Frontend ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Rust Backend ---
FROM rust:1.80-slim-bullseye AS backend-builder
WORKDIR /app/backend
RUN apt-get update && apt-get install -y pkg-config libsqlite3-dev && rm -rf /var/lib/apt/lists/*
COPY backend/Cargo.* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY backend/ ./
RUN cargo build --release

# --- Stage 3: Runtime Container ---
FROM debian:bullseye-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates libsqlite3-0 && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /app/backend/target/release/duitin-backend /app/duitin-backend
COPY --from=backend-builder /app/backend/migrations /app/migrations
COPY --from=frontend-builder /app/frontend/dist /app/static

ENV PORT=8080
ENV DATABASE_URL=sqlite:///app/data/duitin.db?mode=rwc
ENV JWT_SECRET=ganti-kunci-jwt-rahasia-ini-saat-deploy-di-production

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["/app/duitin-backend"]
