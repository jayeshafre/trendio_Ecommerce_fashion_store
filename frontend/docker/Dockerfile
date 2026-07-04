# ─── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes these into the JS bundle at BUILD time, not runtime.
# Passed in from docker-compose.yml's build.args.
ARG VITE_API_BASE_URL
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_APP_NAME
ARG VITE_APP_ENV
ARG VITE_AI_BASE_URL
ARG VITE_AI_SECRET_KEY
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_AI_BASE_URL=$VITE_AI_BASE_URL \
    VITE_AI_SECRET_KEY=$VITE_AI_SECRET_KEY \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ─── Stage 2: Serve ────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]