FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY . .
COPY postcss.config.js ./
COPY tailwind.config.ts ./
RUN npm run build
 
# 실행 스테이지
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./
COPY --from=builder /app/app ./app
COPY --from=builder /app/postcss.config.js ./
COPY --from=builder /app/tailwind.config.ts ./

ENV NODE_ENV=production
ENV PORT=3000
 
EXPOSE 3000
CMD ["npm", "start"]