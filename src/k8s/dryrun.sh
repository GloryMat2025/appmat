#!/usr/bin/env bash
kubectl apply -f $1 --dry-run=client
