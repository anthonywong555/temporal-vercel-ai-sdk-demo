FROM node:22 AS base

# 1. Use Turbo Repo to build out the code.
FROM base AS builder
RUN apt-get update

# Set working directory
WORKDIR /app
RUN npm install -g turbo
ENV TURBO_TELEMETRY_DISABLED=1
COPY . .

# Create a pruned version of web
RUN turbo prune @boilerplate/web --docker

# 2. Building out the project. Not sure why it's called installer. Why not, ¯\_(ツ)_/¯.
FROM base as installer
RUN apt-get update
RUN npm install -g turbo
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app

# First install dependencies (as they cahnge less often)
COPY --from=builder /app/out/json .
RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full .

RUN pnpm dlx turbo build --filter=@boilerplate/web

# Running the web
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 web
RUN adduser --system --uid 1001 web

COPY --chown=1001:1001 --from=installer /app .

USER web
EXPOSE 1000
CMD ["node", "apps/web/build/index.js"]