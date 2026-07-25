FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN pnpm install --frozen-lockfile
# Build shared-types first (web-portals depends on it)
RUN pnpm --filter @medisync/shared-types build
RUN pnpm --filter @medisync/web-portals build

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
EXPOSE 3000
CMD ["pnpm", "--filter", "@medisync/web-portals", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
