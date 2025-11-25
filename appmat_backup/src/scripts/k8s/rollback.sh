#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: rollback.sh -n <namespace> -d <deployment> [-k <kubeconfig>]
USAGE
}

NAMESPACE=""
DEPLOYMENT=""
KCFG="${KUBECONFIG:-}"

while getopts ":n:d:k:h" opt; do
  case $opt in
    n) NAMESPACE="$OPTARG" ;;
    d) DEPLOYMENT="$OPTARG" ;;
    k) KCFG="$OPTARG" ;;
    h) usage; exit 0 ;;
    :) echo "Missing argument for -$OPTARG" >&2; usage; exit 2 ;;
    \?) echo "Unknown option -$OPTARG" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$NAMESPACE" || -z "$DEPLOYMENT" ]]; then
  echo "❌ Missing required arguments" >&2
  usage
  exit 2
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "❌ kubectl not found on PATH" >&2
  exit 4
fi

export KUBECONFIG="$KCFG"
echo "ℹ️ Using KUBECONFIG=${KUBECONFIG:-<default>}"

echo "🔄 Rolling back deployment/$DEPLOYMENT in $NAMESPACE..."
kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"

echo "⏳ Waiting for rollout..."
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=180s

echo "✅ Rollback completed"
