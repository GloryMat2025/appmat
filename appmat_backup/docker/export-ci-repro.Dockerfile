# ==========================================
# APPMAT CI REPRODUCTION DOCKER IMAGE
# ==========================================
FROM ubuntu:24.04

LABEL maintainer="GloryMat2025" \
      purpose="Appmat CI Parity Reproduction"

# 1️⃣ Install base tools
RUN apt-get update && \
    apt-get install -y curl git ca-certificates fonts-liberation \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    wget unzip gnupg && \
    rm -rf /var/lib/apt/lists/*

# 2️⃣ Install Node & pnpm
ENV NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm@9

# 3️⃣ Create workspace
WORKDIR /workspace
COPY . .

# 4️⃣ Install dependencies
RUN pnpm install --frozen-lockfile

# 5️⃣ Install Playwright (with browsers)
RUN npx playwright install --with-deps

# 6️⃣ Build + capture + report + zip
RUN pnpm run build && \
    pnpm run capture || true && \
    pnpm run shots:report || true && \
    pnpm run shots:zip || true

# 7️⃣ Output results
CMD ["bash", "-c", "ls -lh dist && echo '✅ CI Repro complete: see dist/ & gallery.html'"]
