FROM node:22-alpine AS deps

# Native addons (e.g. utf-8-validate via websocket) need node-gyp + Python on Alpine.
RUN apk add --no-cache python3 make g++ \
  && ln -sf python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/data

VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server.js"]
