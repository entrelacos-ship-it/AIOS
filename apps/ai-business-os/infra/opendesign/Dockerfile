# Open Design daemon — standalone service
# Build: clones github.com/nexu-io/open-design, builds daemon + web, ships standalone runtime.
# Runtime: serves UI + API on port 7456 (host 0.0.0.0).

# Stage 0: build daemon + web with Node 24 + pnpm 10
FROM node:24-slim AS builder
RUN apt-get update && apt-get install -y \
    git python3 make g++ ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.33.2 --ignore-scripts

WORKDIR /od
ARG OPEN_DESIGN_REF=main
RUN git clone --depth=1 --branch=${OPEN_DESIGN_REF} https://github.com/nexu-io/open-design.git .
RUN pnpm install
RUN pnpm --filter @open-design/daemon build
RUN pnpm --filter @open-design/web build
RUN pnpm --filter @open-design/daemon deploy --prod --legacy /standalone

# Stage 1: runtime — keep monorepo layout so daemon resolves apps/web/out
FROM node:24-slim AS runtime
RUN apt-get update && apt-get install -y ca-certificates curl git python3 ripgrep --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Agent CLIs (Claude Code, Codex, Gemini) — daemon usa estes para rodar agentes.
# Auth fica nos volumes /root/.claude, /root/.codex, /root/.gemini (montados pelo compose).
RUN npm install -g @anthropic-ai/claude-code @openai/codex @google/gemini-cli --unsafe-perm 2>&1 | tail -5

WORKDIR /app

# Root package.json + bundled content directories
COPY --from=builder /od/package.json /app/package.json
COPY --from=builder /od/skills /app/skills
COPY --from=builder /od/design-systems /app/design-systems
COPY --from=builder /od/design-templates /app/design-templates
COPY --from=builder /od/craft /app/craft
COPY --from=builder /od/plugins /app/plugins

# Daemon standalone (dist + production node_modules)
COPY --from=builder /standalone/dist /app/apps/daemon/dist
COPY --from=builder /standalone/node_modules /app/apps/daemon/node_modules
COPY --from=builder /standalone/package.json /app/apps/daemon/package.json

# Web static export (served by daemon at /)
COPY --from=builder /od/apps/web/out /app/apps/web/out

# Non-root — Claude Code recusa rodar como root. Reusa user `node` (uid 1000) da imagem base.
RUN mkdir -p /data /home/node/.claude /home/node/.codex /home/node/.gemini && \
    chown -R node:node /data /app /home/node

ENV OD_DATA_DIR=/data
ENV HOME=/home/node

USER node
WORKDIR /home/node

EXPOSE 7456

CMD ["node", "/app/apps/daemon/dist/cli.js", "--no-open", "--host", "0.0.0.0", "--port", "7456"]
