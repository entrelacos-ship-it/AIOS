# Stage 1: build EntrelacOS frontend (Node 20)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-slim AS runtime

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY . .

# python-pptx para geração de apresentações PPTX
RUN apt-get update && apt-get install -y python3-pip --no-install-recommends \
    && pip3 install --no-cache-dir --break-system-packages python-pptx \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI — usado pelo Squad creator (spawn via runuser para evitar root)
RUN apt-get update && apt-get install -y util-linux git ripgrep --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @anthropic-ai/claude-code --unsafe-perm \
    && useradd -m -u 1500 -s /bin/bash claudecli \
    && mkdir -p /home/claudecli/.claude \
    && chown -R claudecli:claudecli /home/claudecli

EXPOSE 3010
ENV NODE_ENV=production
ENV PORT=3010
ENV TSX_TSCONFIG_PATH=tsconfig.server.json

CMD ["node", "--import", "tsx/esm", "server.ts"]
