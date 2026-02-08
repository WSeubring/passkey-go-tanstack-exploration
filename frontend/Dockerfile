# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept build-time API URL for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the application (TanStack Start + Nitro outputs to .output/)
RUN npm run build

# Stage 2: Run the Nitro server
FROM node:22-alpine

WORKDIR /app

# Copy the built output from builder
COPY --from=builder /app/.output .output

ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
