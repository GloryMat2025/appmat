#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: apply_patch.sh -n <namespace> -d <deployment> -p <patch_file> [-k <kubeconfig>]

Options:
  -n   Kubernetes namespace (e.g., staging)
  -d   Deployment name (e.g., my-api)
  -p   RFC6902 JSON patch file path
  -k   Path to kubeconfig file (optional). If omitted, uses $KUBECONFIG or default.

Examples:
  ./apply_patch.sh -n staging -d my-api -p deploy/k8s-patches/my-api-enable-claude-sonnet-4-5.patch.json
  ./apply_patch.sh -n staging -d my-api -p patch.json -k ~/.kube/config
USAGE
}

NAMESPACE=""
DEPLOYMENT=""
PATCH_FILE=""
KCFG="${KUBECONFIG:-}"

while getopts ":n:d:p:k:h" opt; do
  case $opt in
    n) NAMESPACE="$OPTARG" ;;
    d) DEPLOYMENT="$OPTARG" ;;
    p) PATCH_FILE="$OPTARG" ;;
    k) KCFG="$OPTARG" ;;
    h) usage; exit 0 ;;
    :) echo "Missing argument for -$OPTARG" >&2; usage; exit 2 ;;
    \?) echo "Unknown option -$OPTARG" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$NAMESPACE" || -z "$DEPLOYMENT" || -z "$PATCH_FILE" ]]; then
  echo "❌ Missing required arguments" >&2
  usage
  exit 2
fi

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "❌ Patch file not found: $PATCH_FILE" >&2
  exit 3
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "❌ kubectl not found on PATH" >&2
  exit 4
fi

export KUBECONFIG="$KCFG"
echo "ℹ️ Using KUBECONFIG=${KUBECONFIG:-<default>}"

echo "🔎 Verifying cluster connectivity..."
if ! kubectl version --request-timeout=10s >/dev/null 2>&1; then
  echo "❌ Unable to contact cluster (check KUBECONFIG)" >&2
  exit 5
fi

echo "📦 Applying JSON patch to deployment/$DEPLOYMENT in namespace $NAMESPACE"
kubectl patch deployment "$DEPLOYMENT" \
  -n "$NAMESPACE" \
  --type=json \
  --patch-file="$PATCH_FILE"

echo "⏳ Waiting for rollout..."
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=180s

echo "✅ Patch applied and rollout successful"
#!/usr/bin/env bash
DEPLOY=$1
NS=$2
PATCH=$3

if [ -z "$DEPLOY" ] || [ -z "$NS" ] || [ -z "$PATCH" ]; then
  echo "Usage: apply_patch.sh <deployment> <namespace> <patch.json>"
  exit 1
fi

kubectl patch deployment $DEPLOY \
  -n $NS \
  --type=json \
  --patch-file=$PATCH
