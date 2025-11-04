#!/usr/bin/env bash
# ==========================================
# Run Appmat Repro in Docker
# ==========================================

set -e
IMAGE_NAME=appmat-repro
OUT_DIR="./docker-out"

echo "🛠 Building Docker image..."
docker build -t $IMAGE_NAME -f docker/export-ci-repro.Dockerfile .

echo "🚀 Running container..."
mkdir -p $OUT_DIR
docker run --rm -v "$(pwd):/workspace" -v "$(pwd)/$OUT_DIR:/workspace/dist" $IMAGE_NAME

echo "✅ Done! Check $OUT_DIR for build outputs."
