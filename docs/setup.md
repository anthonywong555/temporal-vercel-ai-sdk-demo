# Setup Guide

This guide outlines what you need to setup up in order to run this demo.

## Prerequisite

In order to *build* this project you will need the following:

- [NodeJS](https://nodejs.org/en)
- [Docker](https://docs.docker.com/get-started/get-docker/)

In order to *run* this project you will need to have the following services:

- [Temporal](https://docs.temporal.io/cli#start-dev-server)

## Setup

Copy and rename the file `apps/worker/.env.example` to be `apps/worker/.env`.

Run the following commands:
1. pnpm install
1. docker compose up -d postgres
1. pnpm run build
1. pnpm run dev:zero-cache
1. pnpm run dev

### (Optional) Docker Compose

Run the following commands:
1. pnpm install
1. pnpm run build
1. docker compose up:
- The *docker-compose-full.yml* will spin up everything for you.
- The *docker-compose.yml* will not spin up Temporal, but everything else.
