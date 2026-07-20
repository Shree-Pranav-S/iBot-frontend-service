FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8002
ARG VITE_FACE_PROCTORING_ENABLED=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FACE_PROCTORING_ENABLED=$VITE_FACE_PROCTORING_ENABLED

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist
COPY serve.json ./serve.json

ENV PORT=5173
EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173", "-c", "/app/serve.json"]
