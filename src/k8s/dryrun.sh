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
