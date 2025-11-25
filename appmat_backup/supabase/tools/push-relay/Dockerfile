FROM node:18-slim
WORKDIR /usr/src/app

# Install dependencies first (package.json is provided)
COPY package.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 4001
ENV PORT=4001
CMD ["node", "index.real.js"]
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund

# Bundle app
COPY . .

EXPOSE 4000
ENV PORT=4000

CMD ["node", "index.js"]
