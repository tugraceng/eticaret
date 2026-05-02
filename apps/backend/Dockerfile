FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY . .
RUN npm install && npx prisma generate --schema=database/prisma/schema.prisma && npm run build -w @platform/backend
EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
