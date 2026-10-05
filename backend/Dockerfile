# Plain JavaScript (no build step / dist). Node 24: google-auth-library needs Node >= 22.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app ./

USER node

EXPOSE 3000
CMD ["node", "server.js"]
