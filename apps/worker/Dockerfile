FROM node:22 AS base

# 1. Use Turbo Repo to build out the code.
FROM base AS builder
RUN apt-get update

# Set working directory
WORKDIR /app
RUN npm install -g turbo
ENV TURBO_TELEMETRY_DISABLED=1
COPY . .

# Create a pruned version of worker
RUN turbo prune @boilerplate/worker --docker

# 2. Building the project. Not sure why it's called installer. Why not, ¯\_(ツ)_/¯.
FROM base AS installer
RUN apt-get update
RUN npm install -g turbo
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json .
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /app/out/full .

# Build the project
RUN pnpm dlx turbo build --filter=@boilerplate/worker

# Running the Worker
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 web
RUN adduser --system --uid 1001 web

# Don't run production as root
COPY --chown=1001:1001 --from=installer /app .

USER web

# Pass in the Workflow Bundle Path and select the env file to pass in.
CMD WORKFLOW_BUNDLE_PATH=apps/worker/dist/workflow-bundle.js node apps/worker/dist/worker.js