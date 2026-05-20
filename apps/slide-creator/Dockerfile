FROM node:20-alpine

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
