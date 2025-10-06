# Sansa AI Router Development Container
# Dockerfile for Sansa - Smart AI API Router with dual-backend architecture
# 
# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 20, 18, 16, 14, 20-bullseye, 18-bullseye, 16-bullseye, 14-bullseye, 20-buster, 18-buster, 16-buster, 14-buster
# This image supports both AMD64 and ARM64 architectures
ARG VARIANT=20-bullseye
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# Install basic development tools
RUN apt-get update && apt-get install -y git

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
    locales-all \
    libcap-dev \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Set the locale
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

COPY default.cf /usr/local/etc/isolate

# Install package managers and essential tools for Sansa monorepo
RUN npm i -g npm@9.9.3
RUN npm i -g pnpm@9.15.0
RUN npm i -g cross-env@7.0.3

RUN pnpm config set store-dir /root/.local/share/pnpm/store

# Update to use Node.js 20 packages
RUN pnpm store add @tsconfig/node20@20.1.4
RUN pnpm store add @types/node@20.14.8
RUN pnpm store add typescript@4.9.4

# Install Docker CLI and container management tools
RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    && rm -rf /var/lib/apt/lists/*

# Add container management utilities for running dual backend/frontend services
RUN npm i -g pm2@5.3.0
RUN npm i -g concurrently@8.2.0

# Install Firebase CLI for deployment
RUN npm i -g firebase-tools

# Install Node.js 20.3.0 specifically using nvm
# The base image only provides major/minor Node.js versions (e.g., 20.x),
# so we use nvm to install the exact patch version required for this project.
# This ensures consistency across all development environments.
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install 20.3.0 && nvm alias default 20.3.0 && nvm use default"

# Create preview container workspace template directory
RUN mkdir -p /opt/preview-template