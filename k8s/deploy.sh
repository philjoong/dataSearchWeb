#!/bin/bash

# 네임스페이스 생성
kubectl create namespace excel-search

# Secret 적용
kubectl apply -f k8s/secret.yaml -n excel-search

# Deployment와 Service 배포
kubectl apply -f k8s/deployment.yaml -n excel-search

# Ingress 배포
kubectl apply -f k8s/ingress.yaml -n excel-search

# 배포 상태 확인
kubectl get all -n excel-search 

# 상태 확인
kubectl get ingress -n excel-search
kubectl get svc -n excel-search