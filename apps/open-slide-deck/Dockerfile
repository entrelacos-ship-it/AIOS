FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 4100
CMD ["npx", "open-slide", "dev", "--port", "4100", "--host", "0.0.0.0"]
