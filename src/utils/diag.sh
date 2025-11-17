#!/usr/bin/env bash
echo "K8s context:"
kubectl config current-context

echo "Nodes:"
kubectl get nodes

echo "Deployments:"
kubectl get deployments -A
