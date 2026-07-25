FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN pnpm install --frozen-lockfile
# Build shared-types first (backend depends on it)
RUN pnpm --filter @medisync/shared-types build
RUN pnpm --filter @medisync/backend build

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
EXPOSE 3001
CMD ["node", "apps/backend/dist/server.js"]
