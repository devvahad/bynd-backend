FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runner
ARG APP_NAME=bynd-backend
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

RUN mkdir -p /app/logs && chown -R appuser:nodejs /app

COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --chown=appuser:nodejs . .

USER appuser

EXPOSE 3000

CMD ["node", "server/loader.js"]