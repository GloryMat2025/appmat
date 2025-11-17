#!/usr/bin/env bash
DEPLOY=$1
NS=$2

kubectl rollout status deployment/$DEPLOY -n $NS
kubectl get pods -n $NS -l app=$DEPLOY -o wide
