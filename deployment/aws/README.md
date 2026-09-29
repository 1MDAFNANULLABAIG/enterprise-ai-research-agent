# AWS Production Architecture & Deployment Guide

This folder contains the Infrastructure-as-Code (Terraform) and AWS ECS Fargate configurations for hosting the **Enterprise AI Research & Document Agent** on Amazon Web Services.

## High-Level Topology

```
User (Browser)
      ↓
Amazon CloudFront (TLS 1.3 + Static React SPA Edge Caching)
 ├── /index.html, /assets/*  → Amazon S3 (Frontend Bucket)
 └── /api/*                  → Application Load Balancer (ALB)
                                    ↓
                            AWS ECS Fargate Cluster (FastAPI Backend)
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
     Amazon RDS PostgreSQL     Amazon ElastiCache     Amazon S3 Bucket
     (Users, Metadata, Logs)    (Redis 7 Cache)     (Document Encrypted Vault)
                                    ↓
                             Distributed Vector Store
                             (Managed Qdrant Cloud or ECS)
```

## Deployment Steps

1. **Build & Push Containers to AWS ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URL>
   docker build -t <ECR_URL>/enterprise-ai-backend:latest ./backend
   docker push <ECR_URL>/enterprise-ai-backend:latest
   ```

2. **Provision Infrastructure with Terraform**:
   ```bash
   cd deployment/aws
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

3. **Deploy Database Migrations**:
   ```bash
   alembic upgrade head
   ```
