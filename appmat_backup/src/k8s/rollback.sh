#!/usr/bin/env bash
DEPLOY=$1
NS=$2

kubectl rollout undo deployment/$DEPLOY -n $NS
